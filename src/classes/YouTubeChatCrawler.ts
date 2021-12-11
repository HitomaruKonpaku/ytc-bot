import EventEmitter from 'events'
import winston from 'winston'
import { YouTubeVideoMeta } from '../interfaces/meta/YouTubeVideoMeta.interface'
import { logger as baseLogger } from '../logger'
import { YouTubeUtil } from '../utils/YouTubeUtil'

export class YouTubeChatCrawler extends EventEmitter {
  public ytVideoMeta: YouTubeVideoMeta
  public ytConfig: Record<string, any>

  private logger: winston.Logger

  private headers = {
    'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
  }

  constructor(public id: string) {
    super()
    this.logger = baseLogger.child({ label: `[YouTubeChatCrawler@${id}]` })
  }

  public async start() {
    try {
      await this.initVideo()
      await this.initLiveChat()
    } catch (error) {
      this.logger.error(error.message)
      throw error
    }
  }

  private async initVideo() {
    const payload = await YouTubeUtil.getVideoPage(this.id, this.headers)
    const meta = YouTubeUtil.getVideoMeta(payload)
    this.ytVideoMeta = meta
    this.logger.debug('Video meta', meta)
    this.emit('videoMeta', meta)
  }

  private async initLiveChat() {
    const payload = await YouTubeUtil.getInitLiveChat(this.id, this.headers)
    const config = YouTubeUtil.getYtConfig(payload)
    const data = YouTubeUtil.getYtInitialData(payload)
    this.ytConfig = config

    const { actions, continuations } = data.contents.liveChatRenderer
    this.handleActions(actions)
    const newContinuationData = YouTubeUtil.getContinuationData(continuations)
    this.getLiveChatWithTimeout(newContinuationData)
  }

  private async getLiveChat(continuationData: any) {
    this.logger.debug('Get live chat', continuationData)
    try {
      const liveChat = await YouTubeUtil.getNextLiveChat(
        this.ytConfig.INNERTUBE_API_KEY,
        this.ytConfig.INNERTUBE_CONTEXT,
        continuationData.continuation,
        this.headers,
      )
      if (!liveChat.continuationContents) {
        this.logger.info('[STREAM] END')
        this.emit('end')
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
    } catch (error) {
      this.logger.error(`getLiveChat: ${error.message}`)
    }
    this.getLiveChatWithTimeout(continuationData)
  }

  private getLiveChatWithTimeout(continuationData: any) {
    const timeoutMs = continuationData?.timeoutMs || 0
    this.logger.debug(`Get live chat in ${timeoutMs}ms`)
    setTimeout(() => this.getLiveChat(continuationData), timeoutMs)
  }

  private handleActions(actions: any[]) {
    const newActions = YouTubeUtil.getCleanActions(actions)
    this.emit('actions', newActions)
  }
}
