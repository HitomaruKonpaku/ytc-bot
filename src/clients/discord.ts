import {
  Channel, Client, Collection, MessageOptions, MessagePayload, TextChannel,
} from 'discord.js'
import winston from 'winston'
import { DISCORD_COMMANDS } from '../constants/discord-commands.constant'
import { DISCORD_CLIENT_OPTIONS } from '../constants/discord.constant'
import { logger as baseLogger } from '../logger'

class Discord {
  public commands = new Collection<string, any>();

  private logger: winston.Logger
  private client: Client

  constructor() {
    this.logger = baseLogger.child({ label: '[Discord]' })
    this.client = new Client(DISCORD_CLIENT_OPTIONS)
    this.initClientEventHandlers()
  }

  public async start() {
    this.logger.info('Starting...')
    this.initCommands()
    try {
      await this.client.login(process.env.DISCORD_TOKEN)
    } catch (error) {
      this.logger.error(error.message)
    }
  }

  public async getChannel<T extends Channel>(id: string) {
    this.logger.debug(`Get channel: ${id}`)
    try {
      const channel = await this.client.channels.fetch(id) as T
      if (channel instanceof TextChannel) {
        this.logger.debug('TextChannel', { id, name: channel.name })
      } else {
        this.logger.debug('Channel', { id })
      }
      return channel
    } catch (error) {
      const msg = error.message as string
      if (!msg.includes('Unknown Channel')) {
        throw error
      }
      this.logger.error(`${msg} id: ${id}`)
      return null
    }
  }

  public async sendToChannel(channelId: string, options: string | MessagePayload | MessageOptions) {
    try {
      const channel = await this.getChannel<TextChannel>(channelId)
      if (!channel) {
        return null
      }
      const guild = channel.guildId
        ? await this.client.guilds.fetch(channel.guildId)
        : null
      const message = await channel.send(options)
      this.logger.debug(`Message was sent to ${guild.name ? `[${guild.name}]` : ''}#[${channel.name}] (${channelId})`)
      return message
    } catch (error) {
      this.logger.error(error.message, { channelId })
    }
    return null
  }

  private initCommands() {
    this.commands.clear()
    DISCORD_COMMANDS.forEach((v) => this.commands.set(v.command.name, v))
  }

  private initClientEventHandlers() {
    const { client } = this
    client.on('error', (error) => {
      this.logger.error(error.message)
    })
    client.on('warn', (message) => {
      this.logger.warn(message)
    })
    client.on('debug', (message) => {
      this.logger.debug(message)
    })
    client.on('shardError', (error, shardId) => {
      this.logger.error(`[Shard ${shardId}] ${error.message}`)
    })
    client.on('shardReady', (shardId) => {
      this.logger.debug(`[Shard ${shardId}] ready`)
    })
    client.on('shardDisconnect', (ev, shardId) => {
      this.logger.debug(`[Shard ${shardId}] disconnect`)
    })
    client.on('shardReconnecting', (shardId) => {
      this.logger.debug(`[Shard ${shardId}] reconnecting`)
    })
    client.on('shardResume', (shardId) => {
      this.logger.debug(`[Shard ${shardId}] resume`)
    })
    client.once('ready', () => {
      const { user } = client
      this.logger.info(`${user.tag} ready!`)
    })
    client.once('ready', () => {
      // TODO
    })

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return

      const { commandName } = interaction

      const command = this.commands.get(commandName)
      if (!command) return

      try {
        this.logger.debug(`Running command [${commandName}]`)
        await command.execute(interaction)
      } catch (error) {
        this.logger.error(error.message)
        await interaction.editReply({ content: 'There was an error while executing this command!' })
      }
    })
  }
}

export const discord = new Discord()
