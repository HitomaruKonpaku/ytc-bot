import { bold } from 'discord.js'
import EventEmitter from 'events'
import { Logger } from 'winston'
import { baseLogger } from '../../../logger'
import {
  AddChatItemAction,
  ChatListener,
  Masterchat,
  stringify,
} from '../../../submodules/masterchat/src'
import { ConfigService } from '../../config/services/config.service'
import { DiscordService } from '../../discord/services/discord.service'

export class YoutubeChat extends EventEmitter {
  private readonly logger: Logger
  private readonly discordChannelIds = new Set<string>()

  private chatListener: ChatListener
  private chatCount = 0

  constructor(
    public readonly masterchat: Masterchat,
    private readonly configService: ConfigService,
    private readonly discordService: DiscordService,
  ) {
    super()
    const context = `${YoutubeChat.name}] [${masterchat.videoId}`
    this.logger = baseLogger.child({ context })
    this.addListeners()
  }

  public get videoId() {
    return this.masterchat.videoId
  }

  public get channelId() {
    return this.masterchat.channelId
  }

  public addDiscordChannel(id: string) {
    this.logger.debug('addDiscordChannel', { id })
    this.discordChannelIds.add(id)
  }

  public removeDiscordChannel(id: string) {
    this.logger.debug('removeDiscordChannel', { id })
    this.discordChannelIds.delete(id)
  }

  public listen() {
    if (this.chatListener) {
      return
    }
    this.logger.info('listen')
    this.chatListener = this.masterchat.listen()
  }

  private addListeners() {
    const context = `${YoutubeChat.name}] [${this.videoId}] [MC`
    const logger = baseLogger.child({ context })
    const client = this.masterchat

    client.on('error', (error) => {
      logger.error(`${error.message}`)
    })

    client.on('end', (reason) => {
      logger.warn(`End: ${reason}`)
      this.emit('end')
    })

    client.on('chats', (chats) => {
      this.chatCount += chats.length
      logger.debug(`Found ${chats.length} (${this.chatCount}) chats`)
      chats
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .forEach((v) => this.handleChat(v))
    })
  }

  private async handleChat(chat: AddChatItemAction) {
    if (!this.discordChannelIds.size) {
      return
    }

    const config = this.configService.config.youtube
    const channelConfig = config?.channels?.[this.channelId]
    const message = stringify(chat.message) || ''
    const matchKeyword = config?.keywords?.length
      ? Array.from(config.keywords).some((keyword: string) => message.toLowerCase().includes(keyword.toLowerCase()))
      : true
    const canSend = false
      || config?.global?.allowChannelIds?.includes?.(chat.authorChannelId)
      || (matchKeyword && (!channelConfig?.allowChannelIds?.length || channelConfig.allowChannelIds.includes(chat.authorChannelId)))

    if (!canSend) {
      return
    }

    await this.boardcastChat(chat)
  }

  private async boardcastChat(chat: AddChatItemAction) {
    if (!this.discordChannelIds.size) {
      return
    }

    let content = ''
    if (chat.isOwner) {
      content += '▶️'
    }
    if (chat.isModerator) {
      content += '🔧'
    }
    if (!content.length) {
      content += '💬'
    }

    content = [
      content,
      `${chat.authorName || chat.authorChannelId}:`,
      bold(stringify(chat.message) || ''),
    ].join(' ')

    this.logger.debug('boardcastChat', { content })
    await Promise.allSettled([...this.discordChannelIds].map((channelId) => this.discordService.sendToChannel(channelId, { content })))
  }
}
