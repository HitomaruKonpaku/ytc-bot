import winston from 'winston'
import { YouTubeChat } from '../classes/YouTubeChat'
import { YouTubeLiveChatMessageRenderer } from '../interfaces/YouTubeLiveChatMessageRenderer.interface'
import { logger as baseLogger } from '../logger'
import { Util } from '../utils/Util'
import { YouTubeUtil } from '../utils/YouTubeUtil'
import { discord } from './discord'

class DiscordYtc {
  private logger: winston.Logger

  private config: Record<string, any>
  private ytChats: Record<string, {
    ytChat: YouTubeChat,
    channelIds: Set<string>,
  }> = {}

  constructor() {
    this.logger = baseLogger.child({ label: '[DiscordYtc]' })
    this.config = Util.getConfig().ytChat || {}
  }

  public async downloadChat(url: string) {
    this.logger.debug('downloadChat', { url })
    const id = YouTubeUtil.getVideoId(url)
    await this.addYtChat(id)
  }

  public async addChatToChannel(url: string, channelId: string) {
    this.logger.debug('addChatToChannel', { url, channelId })
    const id = YouTubeUtil.getVideoId(url)
    await this.addYtChat(id)
    this.logger.info('addChatToChannel', { url, channelId })
    this.ytChats[id].channelIds.add(channelId)
  }

  public removeChatFromChannel(url: string, channelId: string) {
    this.logger.debug('removeChatFromChannel', { url, channelId })
    const id = YouTubeUtil.getVideoId(url)
    this.logger.info('removeChatFromChannel', { url, channelId })
    this.ytChats[id].channelIds.delete(channelId)
  }

  private async addYtChat(id: string) {
    if (this.ytChats[id]) {
      return
    }

    this.logger.info(`addYtChat: ${id}`)
    const ytChat = new YouTubeChat(id)
    this.ytChats[id] = {
      ytChat,
      channelIds: new Set(),
    }
    this.initYouTubeChatEventHandlers(ytChat)

    try {
      await ytChat.start()
    } catch (error) {
      this.logger.error(`addYtChat: ${error.message}`)
      this.removeYtChat(id)
      throw error
    }
  }

  private removeYtChat(id: string) {
    if (!this.ytChats[id]) {
      return
    }
    this.logger.info(`removeYtChat: ${id}`)
    delete this.ytChats[id]
  }

  private initYouTubeChatEventHandlers(ytChat: YouTubeChat) {
    ytChat.on('stop', () => {
      this.removeYtChat(ytChat.id)
    })
    ytChat.on('streamEnd', () => {
      this.removeYtChat(ytChat.id)
    })
    ytChat.on('videoEnd', () => {
      this.removeYtChat(ytChat.id)
    })
    ytChat.on('liveChatTextMessageRenderer', (renderer: YouTubeLiveChatMessageRenderer) => {
      this.handleLiveChatTextMessageRenderer(ytChat, renderer)
    })
    // ytChat.on('liveChatPaidMessageRenderer', (renderer: YouTubeLiveChatRenderer) => {
    //   // TODO
    // })
  }

  private async handleLiveChatTextMessageRenderer(ytChat: YouTubeChat, renderer: YouTubeLiveChatMessageRenderer) {
    if (!this.ytChats[ytChat.id]) {
      return
    }
    const channelIds = [...this.ytChats[ytChat.id].channelIds]
    if (!channelIds.length) {
      return
    }

    const authorChannelId = YouTubeUtil.getChatAuthorChannelId(renderer)
    const authorName = YouTubeUtil.getChatAuthorName(renderer)
    const message = YouTubeUtil.getChatMessage(renderer)
    if (authorChannelId !== ytChat.ytVideoMeta.channelId || !this.config.allowChannels?.some?.((v) => v.id === authorChannelId)) {
      const blockChannels = this.config.blockChannels || []
      if (blockChannels.length && blockChannels.some((v) => v.id === authorChannelId || v.name === authorName)) {
        return
      }
      const allowChannels = this.config.channels?.[ytChat.ytVideoMeta.channelId]?.allowChannels || []
      if (allowChannels.length && !allowChannels.some((v) => v.id === authorChannelId || v.name === authorName)) {
        return
      }
      const keywords = this.config.keywords || []
      if (message && keywords.length && !keywords.some((v) => message.toLowerCase().includes(v.toLowerCase()))) {
        return
      }
    }

    const content = `💬 ${authorName}: ${message}`.trim()
    this.logger.debug('Message info', { authorName, authorChannelId, msg: message })
    this.logger.verbose(`[${ytChat.id}] [MSG] ${content}`)
    channelIds.forEach((channelId) => {
      discord.sendToChannel(channelId, { content })
    })
  }
}

export const discordYtc = new DiscordYtc()
