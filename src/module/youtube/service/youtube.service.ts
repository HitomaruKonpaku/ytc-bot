import { Inject, Injectable, forwardRef } from '@nestjs/common'
import { bold, hideLinkEmbed } from 'discord.js'
import { AddChatItemAction, EndReason, MasterchatError, stringify, toVideoId } from 'masterchat'
import Innertube from 'youtubei.js'
import { Video } from 'youtubei.js/dist/src/parser/nodes'

import { TrackConfig, config } from '../../../config'
import { baseLogger } from '../../../logger'
import { DiscordService } from '../../discord/service/discord.service'
import { YoutubeChat } from '../model/youtube-chat'
import { YoutubeUtil } from '../util/youtube.util'
import { youtubeChannelLimiter, youtubeVideoChatLimiter } from '../youtube.limiter'

@Injectable()
export class YoutubeService {
  private readonly logger = baseLogger.child({ context: YoutubeService.name })

  private yt: Innertube
  private chats: Record<string, YoutubeChat> = {}
  private ignoreVideoIds = new Set<string>()

  constructor(
    @Inject(forwardRef(() => DiscordService))
    private readonly discordService: DiscordService,
  ) {
    setInterval(() => {
      const ids = Object.keys(this.chats)
      this.logger.debug('chats', { count: ids.length, ids })
    }, 60000)
  }

  public async start() {
    this.logger.info('Starting...')
    await this.initInnertube()
    this.fetchChannels()
  }

  // #region init

  private async initInnertube() {
    this.yt = await Innertube.create({})
  }

  // #endregion

  // #region channel

  private async fetchChannels() {
    const ids = config.youtube?.pollChannelIds || []
    this.logger.debug('fetchChannels', { count: ids.length })

    const limiter = youtubeChannelLimiter
    await Promise.allSettled(ids.map((v) => limiter.schedule(() => this.fetchChannel(v))))

    const ms = config.youtube?.pollInterval || 60000
    setTimeout(() => {
      this.fetchChannels()
    }, ms)
  }

  private async fetchChannel(channelId: string) {
    try {
      this.logger.debug('--> fetchChannel', { channelId })
      const channel = await this.yt.getChannel(channelId)
      const videos = await channel.getLiveStreams()
        .then((v) => [...v.videos])
      const streams = videos
        .filter((v: Video) => v.type === 'Video' && (v.is_live || v.is_upcoming))
        .map((v) => v as Video)
      this.logger.debug('<-- fetchChannel', { channelId, count: streams.length })

      const limiter = youtubeVideoChatLimiter
      streams.forEach((v) => limiter.schedule(() => this.addChat(v.id)))
    } catch (error) {
      this.logger.error(`fetchChannel: ${error.message}`, { channelId })
    }
  }

  // #endregion

  // #region chat

  public async addChat(videoId: string): Promise<YoutubeChat> {
    if (this.chats[videoId]) {
      return this.chats[videoId]
    }

    this.logger.info('addChat#init', { videoId })
    let ytc: YoutubeChat

    try {
      ytc = await YoutubeChat.init(videoId)
      if (ytc.isLive && ytc.isMembersOnly) {
        if (config.youtube?.memberChannelIds?.includes?.(ytc.channelId)) {
          ytc.applyCredentials()
        }
      }
      // eslint-disable-next-line no-param-reassign
      videoId = ytc.videoId
    } catch (error) {
      this.logger.warn(`addChat#error: ${error.message}`, { videoId })
    }

    if (!ytc || this.ignoreVideoIds.has(videoId)) {
      return null
    }

    if (this.chats[videoId]) {
      return this.chats[videoId]
    }

    this.chats[videoId] = ytc
    this.initChatListeners(ytc)

    this.logger.info('addChat#listen', { videoId })
    ytc.listen()

    return ytc
  }

  public async refreshChat(videoIdOrUrl: string): Promise<YoutubeChat> {
    const videoId = toVideoId(videoIdOrUrl)
    const ytc = this.chats[videoId]
    if (!ytc) {
      return null
    }

    await ytc.populateMetadata()
    return ytc
  }

  private removeChat(videoId: string) {
    this.logger.warn('removeChat', { videoId })
    delete this.chats[videoId]
  }

  private initChatListeners(ytc: YoutubeChat) {
    ytc.on('end', (reason) => {
      this.sendEnd(ytc, reason)
      this.removeChat(ytc.videoId)
    })

    ytc.on('error', (error: MasterchatError) => {
      if (error.code === 'disabled') {
        ytc.stop()
        return
      }
      if (error.code === 'membersOnly') {
        this.ignoreVideoIds.add(ytc.videoId)
      }
      ytc.stop()
    })

    ytc.on('chat', (chat) => {
      this.handleChat(ytc, chat)
    })
  }

  private async handleChat(ytc: YoutubeChat, chat: AddChatItemAction) {
    const message = stringify(chat.message)
    const fullTracks = config.tracks || []
    const filterTracks = fullTracks.filter((track) => {
      const userChecks = [
        // filter host chat
        track.userId === chat.authorChannelId
        && ytc.channelId === chat.authorChannelId,
        // filter user chat
        track.userId === ytc.channelId
        && track.filterUserId === chat.authorChannelId,
        // filter user chat from all channel
        !track.userId
        && track.filterUserId === chat.authorChannelId
        && ytc.channelId !== chat.authorChannelId,
      ]
      const baseChecks = [
        !!track.discordChannelId,
        track.allowReplay || ytc.isLive,
        (track.allowNormalChat && !ytc.isMembersOnly) || (track.allowMemberChat && ytc.isMembersOnly),
        !track.filterKeywords?.length || track.filterKeywords.some((keyword) => message.toLocaleLowerCase().includes(keyword.toLowerCase())),
        userChecks.some((v) => v),
      ]
      const matched = baseChecks.every((v) => v)
      return matched
    })

    if (!filterTracks.length) {
      return
    }

    const info = [
      `[${ytc.videoId}]`,
      `[${chat.authorName || chat.authorChannelId}]`,
      message,
    ].join(' ')
    this.logger.info(info)
    await Promise.allSettled(filterTracks.map((track) => this.sendChat(ytc, chat, track)))
  }

  // #endregion

  // #region send

  private async sendChat(ytc: YoutubeChat, chat: AddChatItemAction, track: TrackConfig) {
    if (!track || !track.discordChannelId) {
      return
    }

    const message = stringify(chat.message)
    const icons = []
    if (chat.isOwner) {
      icons.push('▶️')
    }
    if (chat.isModerator) {
      icons.push('🔧')
    }
    if (track.filterUserId) {
      icons.push('💬')
    }

    const lines = [
      `${icons.join('')} ${chat.authorName || chat.authorChannelId}: ${bold(message)}`.trim(),
    ]
    if (!track.userId) {
      const videoUrl = YoutubeUtil.getShortVideoUrl(ytc.videoId)
      lines.push(`↪️ ${ytc.channelName || ytc.channelId} ${hideLinkEmbed(videoUrl)}`)
    }

    const content = lines.join('\n')
    await this.discordService.sendToChannel(track.discordChannelId, { content })
  }

  private async sendEnd(ytc: YoutubeChat, reason: EndReason) {
    const fullTracks = config.tracks || []
    const filterTracks = fullTracks.filter((track) => {
      const baseChecks = [
        !!track.discordChannelId,
        track.allowReplay || ytc.isLive,
        (track.allowNormalChat && !ytc.isMembersOnly) || (track.allowMemberChat && ytc.isMembersOnly),
        track.userId === ytc.channelId,
      ]
      const matched = baseChecks.every((v) => v)
      return matched
    })

    if (!filterTracks.length) {
      return
    }

    const channelIds = [...new Set(filterTracks.map((v) => v.discordChannelId))]
    const content = `[${ytc.videoId}] end: ${reason}`
    await Promise.allSettled(channelIds.map((id) => this.discordService.sendToChannel(id, { content })))
  }

  // #endregion
}
