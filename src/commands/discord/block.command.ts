import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'
import { Channel } from '../../interfaces/App.interface'
import { configManager } from '../../modules/ConfigManager'
import { DiscordUtil } from '../../utils/DiscordUtil'

export class BlockCommand {
  public static readonly command = new SlashCommandBuilder()
    .setName('block')
    .setDescription('Block user from message filter')
    .addSubcommand((subcommand) => subcommand
      .setName('id')
      .setDescription('Block by channel id (recommended)')
      .addStringOption((option) => option
        .setName('id')
        .setDescription('YouTube channel id')
        .setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName('name')
      .setDescription('Block by channel name')
      .addStringOption((option) => option
        .setName('name')
        .setDescription('YouTube channel name')
        .setRequired(true)))

  public static async execute(interaction: CommandInteraction) {
    await interaction.deferReply()
    if (!DiscordUtil.isOwner(interaction.user.id)) {
      await DiscordUtil.replyInteractionInsufficientPermissions(interaction)
      return
    }

    const channel: Channel = {}
    const id = interaction.options.getString('id')
    if (id) {
      channel.id = id
    }
    const name = interaction.options.getString('name')
    if (name) {
      channel.name = name
    }
    const channels = configManager.config.ytChat.blockChannels
    channels.push(channel)
    configManager.save()

    await interaction.editReply(`Blocked "${id || name}"`)
  }
}
