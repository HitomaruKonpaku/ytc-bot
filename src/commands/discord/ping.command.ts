import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'

export class PingCommand {
  public static readonly command = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping!')

  public static async execute(interaction: CommandInteraction) {
    await interaction.reply('Pong!')
  }
}
