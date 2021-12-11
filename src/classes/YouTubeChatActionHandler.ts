import EventEmitter from 'events'
import { appendFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path/posix'
import winston from 'winston'
import { CHAT_DIR } from '../constants/app.constant'
import { YouTubeVideoMeta } from '../interfaces/meta/YouTubeVideoMeta.interface'
import { logger as baseLogger } from '../logger'
import { YouTubeUtil } from '../utils/YouTubeUtil'

export class YouTubeChatActionHandler extends EventEmitter {
  private logger: winston.Logger

  private outDir: string
  private outFile: string
  private msgOutFile: string
  private scOutFile: string

  private allActionCount = 0
  private textMessageCount = 0
  private paidMessageCount = 0

  constructor(
    public id: string,
    public ytVideoMeta: YouTubeVideoMeta,
  ) {
    super()
    this.logger = baseLogger.child({ label: `[YouTubeChatActionHandler@${id}]` })
    this.initOutFiles()
  }

  public handleActions(actions: any[]) {
    const newActionCount = actions?.length || 0
    if (!newActionCount) {
      return
    }
    this.allActionCount += newActionCount
    this.logger.debug(`Found ${newActionCount}/${this.allActionCount} actions`)
    actions.forEach((action) => this.handleAction(action))
    this.logger.debug(`Track ${this.textMessageCount} messages, ${this.paidMessageCount} SuperChats`)
  }

  private initOutFiles() {
    const subDir = this.ytVideoMeta?.author?.name || this.ytVideoMeta?.channelId
    this.outDir = path.join(__dirname, CHAT_DIR, subDir)
    const date = new Date()
    // eslint-disable-next-line max-len
    const time = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()]
      .map((v) => String(v)
        .padStart(2, '0')
        .slice(-2))
      .join('')
    const filename = `${time}_${this.id}`
    this.outFile = path.join(this.outDir, `${filename}.jsonl`)
    this.msgOutFile = path.join(this.outDir, `${filename}_msg.txt`)
    this.scOutFile = path.join(this.outDir, `${filename}_sc.txt`)
    this.logger.info(`Writing chat to "${this.outFile}"`)
    this.logger.info(`Writing chat msg to "${this.msgOutFile}"`)
    this.logger.info(`Writing chat sc to "${this.scOutFile}"`)
  }

  private handleAction(action: any) {
    try {
      if (action.replayChatItemAction) {
        this.logger.warn('handleAction #replayChatItemAction', action)
        return
      }
      if (action.addChatItemAction) {
        this.handleAddChatItemAction(action.addChatItemAction)
        return
      }
      if (action.addBannerToLiveChatCommand) {
        this.logger.warn('handleAction #addBannerToLiveChatCommand', action)
        return
      }
      if (action.addLiveChatTickerItemAction) {
        return
      }
      if (action.markChatItemAsDeletedAction) {
        return
      }
      if (action.markChatItemsByAuthorAsDeletedAction) {
        return
      }
      if (action.replaceChatItemAction) {
        return
      }
      if (action.replaceLiveChatRendererAction) {
        return
      }
      if (action.showLiveChatTooltipCommand) {
        return
      }
      if (action.clickTrackingParams) {
        return
      }
      this.logger.warn('Unhandle action', action)
    } catch (error) {
      this.logger.error(`handleAction: ${error}`, action)
    }
  }

  private handleAddChatItemAction(action: any) {
    const item = YouTubeUtil.getCleanChatItem(action?.item)
    if (!item) {
      return
    }

    if (!existsSync(this.outDir)) {
      mkdirSync(this.outDir, { recursive: true })
    }
    appendFileSync(this.outFile, `${JSON.stringify(item)}\n`)

    if (item.liveChatTextMessageRenderer) {
      const renderer = item.liveChatTextMessageRenderer
      this.handleLiveChatTextMessageRenderer(renderer)
      this.emit('liveChatTextMessageRenderer', renderer)
    }
    if (item.liveChatPaidMessageRenderer) {
      const renderer = item.liveChatPaidMessageRenderer
      this.handleLiveChatPaidMessageRenderer(renderer)
      this.emit('liveChatPaidMessageRenderer', renderer)
    }
  }

  private handleLiveChatTextMessageRenderer(renderer: any) {
    this.textMessageCount += 1
    try {
      const authorName = renderer.authorName.simpleText
      const message = YouTubeUtil.buildMessage(renderer.message)
      const line = `${authorName}: ${message}`
      appendFileSync(this.msgOutFile, `${line}\n`)
    } catch (error) {
      this.logger.error(`handleLiveChatTextMessageRenderer: ${error.message}`, { renderer })
    }
  }

  private handleLiveChatPaidMessageRenderer(renderer: any) {
    this.paidMessageCount += 1
    try {
      const authorName = renderer.authorName?.simpleText
      const purchaseAmount = renderer.purchaseAmountText?.simpleText
      const message = YouTubeUtil.buildMessage(renderer.message)
      const line = `${authorName}: [${purchaseAmount}] ${message}`
      appendFileSync(this.scOutFile, `${line}\n`)
    } catch (error) {
      this.logger.error(`handleLiveChatPaidMessageRenderer: ${error.message}`, { renderer })
    }
  }
}
