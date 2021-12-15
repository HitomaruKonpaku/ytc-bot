import { CommandInteraction } from 'discord.js'
import { logger as baseLogger } from '../logger'

const logger = baseLogger.child({ label: '[DiscordUtil]' })

export class DiscordUtil {
  public static isOwner(id: string) {
    return process.env.DISCORD_OWNER_ID === id
  }

  public static async replyInteractionInsufficientPermissions(interaction: CommandInteraction) {
    try {
      await interaction.editReply('❌ Insufficient Permissions')
      setTimeout(() => this.deleteInteraction(interaction), 10000)
    } catch (error) {
      logger.error(`replyInteractionInsufficientPermissions: ${error.message}`)
    }
  }

  public static async deleteInteraction(interaction: CommandInteraction) {
    try {
      await interaction.deleteReply()
    } catch (error) {
      logger.error(`deleteInteraction: ${error.message}`)
    }
  }
}
