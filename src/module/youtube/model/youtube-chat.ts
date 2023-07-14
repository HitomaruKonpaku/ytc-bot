import {
  AddSuperChatItemAction,
  Credentials,
  Masterchat,
  MasterchatError,
  stringify,
  toVideoId,
} from 'masterchat'
import winston from 'winston'

import { config } from '../../../config'
import { baseLogger, chatLogger, superchatLogger } from '../../../logger'
import { Events } from '../interface/youtube-chat.interface'
import { YoutubeChatUtil } from '../util/youtube-chat.util'

export interface YoutubeChat {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;
  once<U extends keyof Events>(event: U, listener: Events[U]): this;
  addListener<U extends keyof Events>(event: U, listener: Events[U]): this;
  off<U extends keyof Events>(event: U, listener: Events[U]): this;
  removeListener<U extends keyof Events>(event: U, listener: Events[U]): this;
  emit<U extends keyof Events>(
    event: U,
    ...args: Parameters<Events[U]>
  ): boolean;
}

// eslint-disable-next-line no-redeclare
export class YoutubeChat extends Masterchat {
  private logger: winston.Logger
  private chatLogger: winston.Logger
  private chatScLogger: winston.Logger
  private superchatLogger: winston.Logger

  constructor(videoId: string) {
    super(videoId, '')
    this.initLogger(videoId)
    this.initListeners()
  }

  public static async init(videoIdOrUrl: string) {
    const ytc = new YoutubeChat(toVideoId(videoIdOrUrl))
    await ytc.populateMetadata()
    return ytc
  }

  public applyCredentials() {
    const credentials: Credentials = {
      HSID: process.env.YOUTUBE_HSID,
      SSID: process.env.YOUTUBE_SSID,
      APISID: process.env.YOUTUBE_APISID,
      SAPISID: process.env.YOUTUBE_SAPISID,
      SID: process.env.YOUTUBE_SID,
    }
    this.logger.warn('applyCredentials')
    this.setCredentials(credentials)
  }

  public async populateMetadata() {
    await super.populateMetadata()
    this.initLogger(this.videoId)
  }

  private initLogger(videoId: string) {
    this.logger = baseLogger.child({ context: ['YTC', videoId] })
    this.chatLogger = chatLogger.child({ context: ['YTC_', videoId] })
    this.chatScLogger = chatLogger.child({ context: ['YTSC', videoId] })
    this.superchatLogger = superchatLogger(videoId).child({ context: ['YTSC'] })
  }

  private initListeners() {
    this.on('end', (reason) => {
      this.logger.warn(`end: ${reason}`)
    })

    this.on('error', (error: MasterchatError) => {
      this.logger.error(`error: ${error.message}`, { code: error.code })
    })

    this.on('actions', (actions) => {
      if (this.listenerCount('superchats') > 0 || this.listenerCount('superchat') > 0) {
        const chats = actions.filter((action): action is AddSuperChatItemAction => action.type === 'addSuperChatItemAction')
        this.emit('superchats', chats, this)
        chats.forEach((chat) => this.emit('superchat', chat, this))
      }
    })

    this.on('chat', (chat) => {
      const message = stringify(chat.message) || ''
      const info = [
        `[${chat.authorName || chat.authorChannelId}]`,
        message,
      ].join(' ').trim()
      this.logger.debug(info)

      if (config.youtube?.pollChannelIds?.includes?.(chat.authorChannelId)) {
        this.chatLogger.info(info)
      }
    })

    this.on('superchat', (chat) => {
      const message = stringify(chat.message) || ''
      const info = [
        YoutubeChatUtil.toColorEmoji(chat.color),
        `[${chat.authorName || chat.authorChannelId}]`,
        `[${chat.currency} ${chat.amount}]`,
        message,
      ].join(' ').trim()
      this.logger.debug(info)
      this.superchatLogger.info(info)

      if (config.youtube?.pollChannelIds?.includes?.(chat.authorChannelId)) {
        this.chatScLogger.info(info)
      }
    })
  }
}
