import { Inject, Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  Interaction,
} from 'discord.js'
import { baseLogger } from '../../../logger'
import { DISCORD_APP_COMMANDS } from '../constants/discord-command.constant'
import { DISCORD_CLIENT_OPTIONS } from '../constants/discord.constant'

@Injectable()
export class DiscordClientService extends Client {
  private readonly logger = baseLogger.child({ context: DiscordClientService.name })

  public commands = new Collection<string, any>()

  constructor(
    @Inject(ModuleRef)
    private readonly moduleRef: ModuleRef,
  ) {
    super(DISCORD_CLIENT_OPTIONS)
    this.initCommands()
    this.addClientListeners()
  }

  private initCommands() {
    const commands = DISCORD_APP_COMMANDS
    commands.forEach((v) => this.commands.set(v.command.name, v))
  }

  private addClientListeners() {
    this.addClientBaseListeners()
    this.addClientShardListeners()
    this.addClientReadyListeners()
    this.addClientInteractionListeners()
  }

  private addClientBaseListeners() {
    this.on('error', (error) => {
      this.logger.error(error.message)
    })
    this.on('warn', (message) => {
      this.logger.warn(message)
    })
    this.on('debug', (message) => {
      this.logger.debug(message)
    })
  }

  private addClientShardListeners() {
    this.on('shardError', (error, shardId) => {
      this.logger.error(`[Shard ${shardId}] ${error.message}`)
    })
    this.on('shardReady', (shardId) => {
      this.logger.debug(`[Shard ${shardId}] ready`)
    })
    this.on('shardDisconnect', (ev, shardId) => {
      this.logger.debug(`[Shard ${shardId}] disconnect`)
    })
    this.on('shardReconnecting', (shardId) => {
      this.logger.debug(`[Shard ${shardId}] reconnecting`)
    })
    this.on('shardResume', (shardId) => {
      this.logger.debug(`[Shard ${shardId}] resume`)
    })
  }

  private addClientReadyListeners() {
    this.on('ready', async () => {
      await this.application.fetch()
      this.logger.warn('application fetched')
    })

    this.on('ready', () => {
      const { user } = this
      this.logger.warn(`${user.tag} ready!`)
    })
  }

  private addClientInteractionListeners() {
    this.on('interactionCreate', (interaction) => this.handleInteractionCreate(interaction))
  }

  private async handleInteractionCreate(interaction: Interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await this.handleCommandInteraction(interaction)
        return
      }
    } catch (error) {
      this.logger.error(`handleInteractionCreate: ${error.message}`)
    }
  }

  private async handleCommandInteraction(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply()

    const { user, commandName } = interaction
    const command = this.commands.get(commandName)
    if (!command) {
      await interaction.editReply('Command not found')
      return
    }

    try {
      const meta = {
        user: { id: user.id, tag: user.tag },
        channel: { id: interaction.channelId, name: interaction.channel?.name },
        guild: { id: interaction.guildId, name: interaction.guild?.name },
        options: interaction.options?.data,
      }
      this.logger.debug(`handleCommandInteraction: Running command [${commandName}]`, meta)
      const instance = this.moduleRef.get(command)
      await instance?.execute?.(interaction)
    } catch (error) {
      this.logger.error(`handleCommandInteraction: ${error.message}`, { command: commandName })
      await interaction.editReply('There was an error while executing this command!')
    }
  }
}
