import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'
import { discordYtc } from '../../clients/discord-ytc'
import { DiscordUtil } from '../../utils/DiscordUtil'
import { YouTubeUtil } from '../../utils/YouTubeUtil'

export class AddCommand {
  public static readonly command = new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add chat relay to current channel')
    .addStringOption((option) => option
      .setName('url')
      .setDescription('YouTube video url or id')
      .setRequired(true))
    .addStringOption((option) => option
      .setName('channel_id')
      .setDescription('Destination channel id'))

  public static async execute(interaction: CommandInteraction) {
    await interaction.deferReply()
    if (!DiscordUtil.isOwner(interaction.user.id)) {
      await DiscordUtil.replyInteractionInsufficientPermissions(interaction)
      return
    }

    const url = interaction.options.getString('url')
    const channelId = interaction.options.getString('channel_id') || interaction.channelId

    try {
      await discordYtc.addChatToChannel(url, channelId)
      await interaction.editReply(`Added __**<${YouTubeUtil.getVideoUrl(YouTubeUtil.getVideoId(url))}>**__`)
    } catch (error) {
      await interaction.editReply(error.message)
    }
  }
}
