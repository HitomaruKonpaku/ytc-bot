import EventEmitter from 'events'
import winston from 'winston'
import { YouTubeVideoMeta } from '../interfaces/meta/YouTubeVideoMeta.interface'
import { logger as baseLogger } from '../logger'
import { Util } from '../utils/Util'
import { YouTubeUtil } from '../utils/YouTubeUtil'

export class YouTubeChatCrawler extends EventEmitter {
  public ytVideoMeta: YouTubeVideoMeta

  private logger: winston.Logger

  private headers = {
    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
  }

  private ytVideoInitialData: Record<string, any>
  private ytConfig: Record<string, any>
  private isMembersOnly = false
  private isStreaming = true

  constructor(public id: string) {
    super()
    this.logger = baseLogger.child({ label: `[YouTubeChatCrawler@${id}]` })
  }

  public async start() {
    try {
      this.setCookies()
      await this.initVideo()
      await this.initLiveChat()
    } catch (error) {
      this.logger.error(error.message)
      throw error
    }
  }

  private setCookies() {
    const cookies = Util.getCookies()
    if (cookies?.length) {
      const cookie = cookies
        .map((v) => [v.name, v.value].join('='))
        .join(';')
      Object.assign(this.headers, { cookie })
      this.logger.info('Cookies applied')
    }
  }

  private async initVideo() {
    const payload = await YouTubeUtil.getVideoPage(this.id, this.headers)
    const meta = YouTubeUtil.getVideoMeta(payload)
    const data = YouTubeUtil.getYtInitialData(payload)
    this.ytVideoMeta = meta
    this.ytVideoInitialData = data

    const dataString = JSON.stringify(this.ytVideoInitialData)
    if (dataString.includes('BADGE_STYLE_TYPE_MEMBERS_ONLY')) {
      this.isMembersOnly = true
    }
    if (dataString.includes('Streamed live')) {
      this.isStreaming = false
    }

    this.logger.debug('Video meta', meta)
    this.emit('videoMeta', meta)
  }

  private async initLiveChat() {
    const payload = this.isStreaming
      ? await YouTubeUtil.getInitLiveChat(this.id, this.headers)
      : await YouTubeUtil.getInitLiveChatReplay(this.getReloadContinuation(), this.headers)
    const config = YouTubeUtil.getYtConfig(payload)
    const data = YouTubeUtil.getYtInitialData(payload)
    this.ytConfig = config

    // eslint-disable-next-line max-len
    const { actions, continuations } = this.isStreaming ? data.contents.liveChatRenderer : data.continuationContents.liveChatContinuation
    this.handleActions(actions)
    const newContinuationData = YouTubeUtil.getContinuationData(continuations)
    this.getLiveChatWithTimeout(newContinuationData)
  }

  private getReloadContinuation() {
    // eslint-disable-next-line max-len
    const continuation = this.ytVideoInitialData?.contents?.twoColumnWatchNextResults?.conversationBar?.liveChatRenderer?.continuations?.[0]?.reloadContinuationData?.continuation
    if (!continuation) {
      this.logger.warn('reload continuation not found')
    }
    return continuation
  }

  private async getLiveChat(continuationData: any) {
    if (this.isStreaming) {
      this.logger.debug('Get live chat', continuationData)
    } else {
      this.logger.debug('Get live chat replay', continuationData)
    }
    try {
      const liveChat = this.isStreaming
        // eslint-disable-next-line max-len
        ? await YouTubeUtil.getNextLiveChat(this.ytConfig.INNERTUBE_API_KEY, this.ytConfig.INNERTUBE_CONTEXT, continuationData.continuation, this.headers)
        // eslint-disable-next-line max-len
        : await YouTubeUtil.getNextLiveChatReplay(this.ytConfig.INNERTUBE_API_KEY, this.ytConfig.INNERTUBE_CONTEXT, continuationData.continuation, this.headers)
      if (!liveChat.continuationContents) {
        this.logger.info('[STREAM] END')
        this.emit('streamEnd')
        return
      }
      const { actions, continuations } = liveChat.continuationContents.liveChatContinuation
      this.handleActions(actions)
      const newContinuationData = YouTubeUtil.getContinuationData(continuations)
      if (newContinuationData) {
        this.getLiveChatWithTimeout(newContinuationData)
        return
      }
      this.logger.warn('newContinuationData not found', continuations)
      if (!this.isStreaming) {
        this.logger.info('[VIDEO] END')
        this.emit('videoEnd')
        return
      }
    } catch (error) {
      this.logger.error(`getLiveChat: ${error.message}`)
      if (error.response?.status === 404) {
        this.emit('stop')
        return
      }
    }
    this.getLiveChatWithTimeout(continuationData)
  }

  private getLiveChatWithTimeout(continuationData: any) {
    const timeoutMs = continuationData?.timeoutMs || 0
    if (this.isStreaming) {
      this.logger.debug(`Get live chat in ${timeoutMs}ms`)
    }
    setTimeout(() => this.getLiveChat(continuationData), timeoutMs)
  }

  private handleActions(actions: any[]) {
    const newActions = YouTubeUtil.getCleanActions(actions)
    this.emit('actions', newActions)
  }
}
