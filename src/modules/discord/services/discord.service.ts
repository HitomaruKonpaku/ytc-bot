import { Inject, Injectable } from '@nestjs/common'
import {
  Channel,
  ChannelType,
  MessageOptions,
  MessagePayload,
  TextChannel,
} from 'discord.js'
import { baseLogger } from '../../../logger'
import { DiscordClientService } from './discord-client.service'

@Injectable()
export class DiscordService {
  private readonly logger = baseLogger.child({ context: DiscordService.name })

  constructor(
    @Inject(DiscordClientService)
    private readonly client: DiscordClientService,
  ) {
  }

  public async start() {
    this.logger.info('Starting...')
    try {
      const token = process.env.DISCORD_TOKEN
      if (!token) {
        this.logger.error('DISCORD_TOKEN not found')
      }
      await this.client.login(token)
      this.logger.warn('Logged in!')
    } catch (error) {
      this.logger.error(`start: ${error.message}`)
    }
  }

  public async getGuild(id: string) {
    try {
      const guild = await this.client.guilds.fetch(id)
      this.logger.debug('getGuild', { id, name: guild.name })
      return guild
    } catch (error) {
      this.logger.error(`getGuild: ${error.message}`, { id })
      return null
    }
  }

  public async getChannel<T extends Channel>(id: string) {
    try {
      const channel = await this.client.channels.fetch(id) as any as T
      if (channel.type === ChannelType.GuildText) {
        this.logger.debug('getChannel: TextChannel', { id, name: channel.name })
      } else {
        this.logger.debug('getChannel: Channel', { id })
      }
      return channel
    } catch (error) {
      this.logger.error(`getChannel: ${error.message}`, { id })
      return null
    }
  }

  public async sendToChannel(
    channelId: string,
    options: string | MessagePayload | MessageOptions,
    config?: { throwError?: boolean },
  ) {
    try {
      // Get channel
      const channel = await this.getChannel<TextChannel>(channelId)
      if (!channel) return null

      const guild = channel.guildId
        ? await this.getGuild(channel.guildId)
        : null
      // Send message
      const message = await channel.send(options)
      if (message) {
        this.logger.debug(`Message was sent to ${guild.name ? `[${guild.name}]` : ''}[#${channel.name}] (${channelId})`)
      }
      // Return message
      return message
    } catch (error) {
      this.logger.error(`sendToChannel: ${error.message}`, { channelId })
      if (config?.throwError) {
        throw error
      }
    }
    return null
  }
}
