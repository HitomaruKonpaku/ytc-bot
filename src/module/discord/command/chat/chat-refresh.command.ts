import { Inject, Injectable } from '@nestjs/common'
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import { baseLogger } from '../../../../logger'
import { YoutubeService } from '../../../youtube/service/youtube.service'
import { YoutubeUtil } from '../../../youtube/util/youtube.util'
import { BaseCommand } from '../base/base-command'

@Injectable()
export class ChatRefreshCommand extends BaseCommand {
  protected readonly logger = baseLogger.child({ context: ChatRefreshCommand.name })

  constructor(
    @Inject(YoutubeService)
    private readonly youtubeService: YoutubeService,
  ) {
    super()
  }

  public static readonly command = new SlashCommandBuilder()
    .setName('chat_refresh')
    .setDescription('Refresh chat metadata')
    .addStringOption((option) => option
      .setName('id')
      .setDescription('YouTube video id or url')
      .setRequired(true))

  public async execute(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString('id')

    try {
      const ytc = await this.youtubeService.refreshChat(id)
      if (!ytc) {
        await interaction.editReply('Video not found!')
        return
      }

      await interaction.editReply({
        embeds: [{
          title: ytc.title,
          description: `**[${ytc.videoId}](${YoutubeUtil.getShortVideoUrl(ytc.videoId)})** chat refreshed`,
          color: 0x1d9bf0,
          author: {
            name: ytc.channelName || ytc.channelId,
            url: YoutubeUtil.getChannelUrl(ytc.channelId),
          },
        }],
      })
    } catch (error) {
      this.logger.error(`execute: ${error.message}`, { id })
      await interaction.editReply(error.message)
    }
  }
}
