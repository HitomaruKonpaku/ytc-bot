import { Inject, Injectable } from '@nestjs/common'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { baseLogger } from '../../../../logger'
import { YoutubeService } from '../../../youtube/services/youtube.service'
import { YoutubeUtils } from '../../../youtube/utils/youtube.utils'
import { BaseCommand } from '../base/base-command'

@Injectable()
export class ChatRemoveCommand extends BaseCommand {
  protected readonly logger = baseLogger.child({ context: ChatRemoveCommand.name })

  constructor(
    @Inject(YoutubeService)
    private readonly youtubeService: YoutubeService,
  ) {
    super()
  }

  public static readonly command = new SlashCommandBuilder()
    .setName('chat_remove')
    .setDescription('Remove chat relay')
    .addStringOption((option) => option
      .setName('id')
      .setDescription('YouTube video url or id')
      .setRequired(true))
    .addStringOption((option) => option
      .setName('channel_id')
      .setDescription('Destination channel id'))

  public async execute(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString('id')
    const channelId = interaction.options.getString('channel_id') || interaction.channelId
    const meta = { id, channelId }
    this.logger.debug('--> execute', meta)

    if (!this.isAppOwner(interaction)) {
      await this.replyOwnerOnly(interaction)
      return
    }

    try {
      await interaction.client.channels.fetch(channelId)

      const masterchat = await this.youtubeService.remove(id, channelId)
      if (!masterchat) {
        await interaction.editReply('Chat not found')
        return
      }

      await interaction.editReply({
        embeds: [{
          title: masterchat.title,
          description: `**[${masterchat.videoId}](${YoutubeUtils.getVideoUrl(masterchat.videoId)})** chat relay removed`,
          color: 0x1d9bf0,
          author: {
            name: masterchat.channelName || masterchat.channelId,
            url: YoutubeUtils.getChannelUrl(masterchat.channelId),
          },
        }],
      })
      this.logger.debug('<-- execute', meta)
    } catch (error) {
      this.logger.error(`execute: ${error.message}`, { id, channelId })
      await interaction.editReply(error.message)
    }
  }
}
