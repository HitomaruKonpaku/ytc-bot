import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'
import { discordYtc } from '../../clients/discord-ytc'
import { YouTubeUtil } from '../../utils/YouTubeUtil'

export class RemoveCommand {
  public static readonly command = new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove chat relay from current channel')
    .addStringOption((option) => option
      .setName('url')
      .setDescription('YouTube video url or id')
      .setRequired(true))

  public static async execute(interaction: CommandInteraction) {
    await interaction.deferReply()
    const url = interaction.options.getString('url')
    const { channelId } = interaction

    try {
      discordYtc.removeChatFromChannel(url, channelId)
      await interaction.editReply(`Removed __**${YouTubeUtil.getVideoId(url)}**__`)
    } catch (error) {
      await interaction.editReply(error.message)
    }
  }
}
