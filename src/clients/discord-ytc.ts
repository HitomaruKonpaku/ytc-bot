import winston from 'winston'
import { YouTubeChat } from '../classes/YouTubeChat'
import { logger as baseLogger } from '../logger'
import { YouTubeUtil } from '../utils/YouTubeUtil'

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
    ytChat.on('end', () => {
      this.removeYtChat(ytChat.id)
    })
    // ytChat.on('liveChatTextMessageRenderer', (renderer: any) => {
    //   // TODO
    // })
    // ytChat.on('liveChatPaidMessageRenderer', (renderer: any) => {
    //   // TODO
    // })
  }
}

export const discordYtc = new DiscordYtc()
