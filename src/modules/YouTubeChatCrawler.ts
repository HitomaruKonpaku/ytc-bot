import EventEmitter from 'events'
import winston from 'winston'
import { YouTubeMetaVideo } from '../interfaces/meta/YouTubeMetaVideo.interface'
import { YouTubeLiveChatAction } from '../interfaces/YouTubeLiveChatAction.interface'
import { YouTubeLiveChatContinuationData } from '../interfaces/YouTubeLiveChatContinuationData.interface'
import { logger as baseLogger } from '../logger'
import { Util } from '../utils/Util'
import { YouTubeUtil } from '../utils/YouTubeUtil'

export class YouTubeChatCrawler extends EventEmitter {
  public ytVideoMeta: YouTubeMetaVideo

  private logger: winston.Logger

  private headers: Record<string, any> = {
    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36',
  }

  private ytVideoInitialData: Record<string, any>
  private isMembersOnly = false
  private isStreaming = true

  private INNERTUBE_API_KEY: string
  private INNERTUBE_CONTEXT: Record<string, any>

  constructor(public id: string) {
    super()
    this.logger = baseLogger.child({ label: `[YouTubeChatCrawler@${id}]` })
  }

  public async start() {
    try {
      this.setCookies()
      await this.initVideo()
      this.updateLiveChatHeaders()
      await this.initLiveChat()
      this.cleanupData()
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

  private updateLiveChatHeaders() {
    if (!this.isMembersOnly) {
      return
    }
    Object.assign(this.headers, {
      authorization: YouTubeUtil.getSAPISIDHASH(),
      origin: YouTubeUtil.getOrigin(),
    })
    this.logger.info('Update live chat headers')
  }

  private cleanupData() {
    this.ytVideoInitialData = null
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
    this.INNERTUBE_API_KEY = config.INNERTUBE_API_KEY
    this.INNERTUBE_CONTEXT = config.INNERTUBE_CONTEXT

    const { actions, continuations } = this.isStreaming ? data.contents.liveChatRenderer : data.continuationContents.liveChatContinuation
    this.handleActions(actions)
    const newContinuationData = YouTubeUtil.getContinuationData(continuations)
    this.getLiveChatWithTimeout(newContinuationData)
  }

  private getReloadContinuation() {
    const continuation = this.ytVideoInitialData?.contents?.twoColumnWatchNextResults?.conversationBar?.liveChatRenderer?.continuations?.[0]?.reloadContinuationData?.continuation
    if (!continuation) {
      this.logger.warn('reload continuation not found')
    }
    return continuation
  }

  private async getLiveChat(continuationData: YouTubeLiveChatContinuationData) {
    if (this.isStreaming) {
      this.logger.debug('Get live chat', continuationData)
    } else {
      this.logger.debug('Get live chat replay', continuationData)
    }
    try {
      const liveChat = this.isStreaming
        ? await YouTubeUtil.getNextLiveChat(this.INNERTUBE_API_KEY, this.INNERTUBE_CONTEXT, continuationData.continuation, this.headers)
        : await YouTubeUtil.getNextLiveChatReplay(this.INNERTUBE_API_KEY, this.INNERTUBE_CONTEXT, continuationData.continuation, this.headers)
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
      if (this.isStreaming) {
        this.emit('stop')
        return
      }
      this.logger.info('[VIDEO] END')
      this.emit('videoEnd')
    } catch (error) {
      this.logger.error(`getLiveChat: ${error.message}`)
      if (error.response?.status === 404) {
        this.emit('stop')
        return
      }
      this.getLiveChatWithTimeout(continuationData)
    }
  }

  private getLiveChatWithTimeout(continuationData: YouTubeLiveChatContinuationData) {
    const timeoutMs = continuationData?.timeoutMs || 0
    if (this.isStreaming) {
      this.logger.debug(`Get live chat in ${timeoutMs}ms`)
    }
    setTimeout(() => this.getLiveChat(continuationData), timeoutMs)
  }

  private handleActions(actions: YouTubeLiveChatAction[]) {
    const newActions = YouTubeUtil.getCleanActions(actions)
    this.emit('actions', newActions)
  }
}
