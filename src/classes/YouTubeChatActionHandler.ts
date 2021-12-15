import EventEmitter from 'events'
import { appendFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import winston from 'winston'
import { APP_CHAT_DIR } from '../constants/app.constant'
import { YouTubeMetaVideo } from '../interfaces/meta/YouTubeMetaVideo.interface'
import { YouTubeLiveChatAction } from '../interfaces/YouTubeLiveChatAction.interface'
import { YouTubeLiveChatItem } from '../interfaces/YouTubeLiveChatItem.interface'
import { YouTubeLiveChatMessageRenderer } from '../interfaces/YouTubeLiveChatMessageRenderer.interface'
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
  private memberCount = 0

  constructor(
    public id: string,
    public ytVideoMeta: YouTubeMetaVideo,
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
    this.logger.silly(`Found ${newActionCount}/${this.allActionCount} actions`)
    actions.forEach((action) => this.handleAction(action))
    this.logger.debug(`Track ${this.textMessageCount} messages, ${this.paidMessageCount} SuperChats, ${this.memberCount} new members`)
  }

  private initOutFiles() {
    const subDir = this.ytVideoMeta?.author?.name || this.ytVideoMeta?.channelId
    this.outDir = path.join(__dirname, APP_CHAT_DIR, subDir)
    const date = new Date()
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

  private handleAction(action: YouTubeLiveChatAction) {
    try {
      if (action.replayChatItemAction) {
        this.handleReplayChatItemAction(action.replayChatItemAction)
        return
      }
      if (action.addChatItemAction) {
        this.handleAddChatItemAction(action.addChatItemAction)
        return
      }
      if (action.addBannerToLiveChatCommand) {
        this.handleAddBannerToLiveChatCommand(action.addBannerToLiveChatCommand)
        return
      }
      if (action.addLiveChatTickerItemAction) {
        // this.handleAddLiveChatTickerItemAction(action.addLiveChatTickerItemAction)
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
      this.logger.warn('Unhandle action', { action })
    } catch (error) {
      this.logger.error(`handleAction: ${error}`, { action })
    }
  }

  private appendFile(filePath: string, data: any) {
    try {
      if (!existsSync(this.outDir)) {
        mkdirSync(this.outDir, { recursive: true })
      }
      const payload = `${typeof data === 'string' ? data : JSON.stringify(data)}\n`
      appendFileSync(filePath, payload)
    } catch (error) {
      this.logger.error(`appendFile: ${error.message}`)
    }
  }

  private handleReplayChatItemAction(action: any) {
    this.handleActions(action?.actions)
  }

  private handleAddChatItemAction(action: any) {
    const item = action?.item as YouTubeLiveChatItem
    if (!item) {
      return
    }

    this.appendFile(this.outFile, item)

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
    if (item.liveChatMembershipItemRenderer) {
      const renderer = item.liveChatMembershipItemRenderer
      this.handleLiveChatMembershipItemRenderer(renderer)
      this.emit('liveChatMembershipItemRenderer', renderer)
    }
  }

  private handleLiveChatTextMessageRenderer(renderer: YouTubeLiveChatMessageRenderer) {
    this.textMessageCount += 1
    try {
      const content = YouTubeUtil.buildMessageContent(renderer)
      this.appendFile(this.msgOutFile, content)
    } catch (error) {
      this.logger.error(`handleLiveChatTextMessageRenderer: ${error.message}`, { renderer })
    }
  }

  private handleLiveChatPaidMessageRenderer(renderer: YouTubeLiveChatMessageRenderer) {
    this.paidMessageCount += 1
    try {
      const content = YouTubeUtil.buildMessageContent(renderer)
      this.appendFile(this.scOutFile, content)
    } catch (error) {
      this.logger.error(`handleLiveChatPaidMessageRenderer: ${error.message}`, { renderer })
    }
  }

  private handleLiveChatMembershipItemRenderer(renderer: YouTubeLiveChatMessageRenderer) {
    if (!renderer.message) {
      this.memberCount += 1
    }
  }

  private handleAddBannerToLiveChatCommand(command: any) {
    const { bannerRenderer } = command
    if (!bannerRenderer) {
      this.logger.warn('handleAddBannerToLiveChatCommand: bannerRenderer not found', { command })
      return
    }
    this.appendFile(this.outFile, bannerRenderer)
    const renderer = bannerRenderer.liveChatBannerRenderer?.contents?.liveChatTextMessageRenderer
    if (!renderer) {
      this.logger.warn('handleAddBannerToLiveChatCommand: renderer not found', { command })
      return
    }
    try {
      const content = YouTubeUtil.buildMessageContent(renderer, { isPinned: true })
      this.logger.warn(content)
      this.appendFile(this.msgOutFile, content)
    } catch (error) {
      this.logger.error(`handleAddBannerToLiveChatCommand: ${error.message}`)
    }
    this.emit('liveChatBannerRenderer', bannerRenderer.liveChatBannerRenderer)
  }

  /**
   * @see https://github.com/lyger/matsuri-monitor/blob/master/matsuri_monitor/clients/monitor.py#L37
   */
  private handleAddLiveChatTickerItemAction(action: any) {
    // SuperChat data but alreay handle by `handleAddChatItemAction`
    this.logger.silly('handleAddLiveChatTickerItemAction', { action })
  }
}
