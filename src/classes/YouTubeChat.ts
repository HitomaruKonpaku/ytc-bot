import EventEmitter from 'events'
import winston from 'winston'
import { logger as baseLogger } from '../logger'
import { YouTubeChatActionHandler } from './YouTubeChatActionHandler'
import { YouTubeChatCrawler } from './YouTubeChatCrawler'

export class YouTubeChat extends EventEmitter {
  private logger: winston.Logger

  private crawler: YouTubeChatCrawler
  private actionHandler: YouTubeChatActionHandler

  constructor(public id: string) {
    super()
    this.logger = baseLogger.child({ label: `[YouTubeChat@${id}]` })
  }

  public get ytVideoMeta() {
    return this.crawler?.ytVideoMeta
  }

  public async start() {
    this.logger.info('Starting')
    this.crawler = new YouTubeChatCrawler(this.id)
    this.initCrawlerEventHanders()
    await this.crawler.start()
    this.logger.info('Crawling')
  }

  private initCrawlerEventHanders() {
    this.crawler.on('stop', () => {
      this.emit('stop')
    })
    this.crawler.on('streamEnd', () => {
      this.emit('streamEnd')
    })
    this.crawler.on('videoEnd', () => {
      this.emit('videoEnd')
    })
    this.crawler.once('videoMeta', (meta) => {
      this.actionHandler = new YouTubeChatActionHandler(this.id, meta)
      this.initActionHandlerEventHanders()
    })
    this.crawler.on('actions', (actions: any[]) => {
      this.actionHandler.handleActions(actions)
      this.emit('actions', actions)
    })
  }

  private initActionHandlerEventHanders() {
    this.actionHandler.on('liveChatTextMessageRenderer', (renderer: any) => {
      this.emit('liveChatTextMessageRenderer', renderer)
    })
    this.actionHandler.on('liveChatPaidMessageRenderer', (renderer: any) => {
      this.emit('liveChatPaidMessageRenderer', renderer)
    })
  }
}
