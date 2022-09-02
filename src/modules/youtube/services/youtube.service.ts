import { forwardRef, Inject } from '@nestjs/common'
import { Masterchat } from 'masterchat'
import { baseLogger } from '../../../logger'
import { ConfigService } from '../../config/services/config.service'
import { DiscordService } from '../../discord/services/discord.service'
import { YoutubeChat } from '../models/youtube-chat'
import { youtubeChatAddLimiter } from '../youtube.limiter'

export class YoutubeService {
  private readonly logger = baseLogger.child({ context: YoutubeService.name })

  private readonly chats: Record<string, YoutubeChat> = {}

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => DiscordService))
    private readonly discordService: DiscordService,
  ) { }

  public async add(videoIdOrUrl: string, discordChannelId: string) {
    const masterchat = await youtubeChatAddLimiter.schedule(() => this.getMasterChat(videoIdOrUrl))
    let chat = this.chats[masterchat.videoId]
    if (!chat) {
      chat = new YoutubeChat(masterchat, this.configService, this.discordService)
      this.addChatListeners(chat)
      this.chats[chat.videoId] = chat
      this.logger.warn(`[${chat.videoId}] Add chat`)
    }
    chat.addDiscordChannel(discordChannelId)
    chat.listen()
    return chat.masterchat
  }

  public async remove(videoIdOrUrl: string, discordChannelId: string) {
    const masterchat = await this.getMasterChat(videoIdOrUrl)
    const chat = this.chats[masterchat.videoId]
    if (!chat) {
      return null
    }
    chat.removeDiscordChannel(discordChannelId)
    return chat.masterchat
  }

  private async getMasterChat(videoIdOrUrl: string) {
    let masterchat = this.chats[videoIdOrUrl]?.masterchat
    if (!masterchat) {
      masterchat = await Masterchat.init(videoIdOrUrl)
    }
    return masterchat
  }

  private addChatListeners(chat: YoutubeChat) {
    chat.once('end', () => {
      delete this.chats[chat.videoId]
      this.logger.warn(`[${chat.videoId}] Remove chat`)
    })
  }
}
