import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'
import { discordYtc } from '../../clients/discord-ytc'
import { YouTubeUtil } from '../../utils/YouTubeUtil'

export class AddCommand {
  public static readonly command = new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add chat relay to current channel')
    .addStringOption((option) => option
      .setName('url')
      .setDescription('YouTube video url or id')
      .setRequired(true))

  public static async execute(interaction: CommandInteraction) {
    await interaction.deferReply()
    const url = interaction.options.getString('url')
    const { channelId } = interaction

    try {
      await discordYtc.addChatToChannel(url, channelId)
      await interaction.editReply(`Added __**${YouTubeUtil.getVideoId(url)}**__`)
    } catch (error) {
      await interaction.editReply(error.message)
    }
  }
}
