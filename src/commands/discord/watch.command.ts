import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'
import { discordYtc } from '../../clients/discord-ytc'
import { YouTubeUtil } from '../../utils/YouTubeUtil'

export class WatchCommand {
  public static readonly command = new SlashCommandBuilder()
    .setName('watch')
    .setDescription('Watch live chat')
    .addStringOption((option) => option
      .setName('url')
      .setDescription('YouTube video url or id')
      .setRequired(true))

  public static async execute(interaction: CommandInteraction) {
    await interaction.deferReply()
    const url = interaction.options.getString('url')

    try {
      await discordYtc.downloadChat(url)
      await interaction.editReply(`Watching __**${YouTubeUtil.getVideoId(url)}**__ chat...`)
    } catch (error) {
      await interaction.editReply(error.message)
    }
  }
}
