import winston from 'winston'
import { YouTubeChat } from '../classes/YouTubeChat'
import { logger as baseLogger } from '../logger'
import { YouTubeUtil } from '../utils/YouTubeUtil'
import { discord } from './discord'

class DiscordYtc {
  private logger: winston.Logger

  private ytChats: Record<string, {
    ytChat: YouTubeChat,
    channelIds: Set<string>,
  }> = {}

  constructor() {
    this.logger = baseLogger.child({ label: '[DiscordYtc]' })
  }

  public async downloadChat(url: string) {
    this.logger.debug('downloadChat', { url })
    const id = YouTubeUtil.getVideoId(url)
    await this.addYtChat(id)
  }

  public async addChatToChannel(url: string, channelId: string) {
    this.logger.debug('addChatToChannel', { url, channelId })
    const id = YouTubeUtil.getVideoId(url)
    await this.addYtChat(id)
    this.logger.info('addChatToChannel', { url, channelId })
    this.ytChats[id].channelIds.add(channelId)
  }

  public removeChatFromChannel(url: string, channelId: string) {
    this.logger.debug('removeChatFromChannel', { url, channelId })
    const id = YouTubeUtil.getVideoId(url)
    this.logger.info('removeChatFromChannel', { url, channelId })
    this.ytChats[id].channelIds.delete(channelId)
  }

  private async addYtChat(id: string) {
    if (this.ytChats[id]) {
      return
    }

    this.logger.info(`addYtChat: ${id}`)
    const ytChat = new YouTubeChat(id)
    this.ytChats[id] = {
      ytChat,
      channelIds: new Set(),
    }
    this.initYouTubeChatEventHandlers(ytChat)

    try {
      await ytChat.start()
    } catch (error) {
      this.logger.error(`addYtChat: ${error.message}`)
      this.removeYtChat(id)
      throw error
    }
  }

  private removeYtChat(id: string) {
    if (!this.ytChats[id]) {
      return
    }
    this.logger.info(`removeYtChat: ${id}`)
    delete this.ytChats[id]
  }

  private initYouTubeChatEventHandlers(ytChat: YouTubeChat) {
    ytChat.on('stop', () => {
      this.removeYtChat(ytChat.id)
    })
    ytChat.on('streamEnd', () => {
      this.removeYtChat(ytChat.id)
    })
    ytChat.on('liveChatTextMessageRenderer', (renderer: any) => {
      this.handleLiveChatTextMessageRenderer(ytChat, renderer)
    })
    // ytChat.on('liveChatPaidMessageRenderer', (renderer: any) => {
    //   // TODO
    // })
  }

  private async handleLiveChatTextMessageRenderer(ytChat: YouTubeChat, renderer: any) {
    if (!this.ytChats[ytChat.id]) {
      return
    }
    const channelIds = [...this.ytChats[ytChat.id].channelIds]
    if (!channelIds.length) {
      return
    }

    const authorName = YouTubeUtil.getChatAuthorName(renderer)
    const message = YouTubeUtil.getChatMessage(renderer)
    if (!['[EN]'].some((v) => message.toLowerCase().includes(v.toLowerCase()))) {
      return
    }

    const content = `💬 ${authorName}: ${message} | ${ytChat.id}`
    this.logger.verbose(`[MSG] ${content}`)
    channelIds.forEach((channelId) => {
      discord.sendToChannel(channelId, { content })
    })
  }
}

export const discordYtc = new DiscordYtc()
