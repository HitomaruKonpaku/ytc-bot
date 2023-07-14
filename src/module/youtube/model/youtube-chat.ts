import { Credentials, Masterchat, MasterchatError, stringify, toVideoId } from 'masterchat'
import winston from 'winston'

import { config } from '../../../config'
import { baseLogger, chatLogger } from '../../../logger'

export class YoutubeChat extends Masterchat {
  private logger: winston.Logger
  private chatLogger: winston.Logger

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
    this.logger = baseLogger.child({ context: [YoutubeChat.name, videoId] })
    this.chatLogger = chatLogger.child({ context: [videoId] })
  }

  private initListeners() {
    this.on('end', (reason) => {
      this.logger.warn(`end: ${reason}`)
    })

    this.on('error', (error: MasterchatError) => {
      this.logger.error(`error: ${error.message}`, { code: error.code })
    })

    this.on('chat', (chat) => {
      const message = stringify(chat.message)
      const info = [
        `[${chat.authorName || chat.authorChannelId}]`,
        message,
      ].join(' ')
      this.logger.debug(info)
    })

    this.on('chat', (chat) => {
      if (!config.youtube?.pollChannelIds?.includes?.(chat.authorChannelId)) {
        return
      }

      const message = stringify(chat.message)
      const info = [
        `[${chat.authorName || chat.authorChannelId}]`,
        message,
      ].join(' ')
      this.chatLogger.info(info)
    })
  }
}
