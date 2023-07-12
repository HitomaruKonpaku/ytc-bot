import { forwardRef, Module } from '@nestjs/common'
import { DiscordModule } from '../discord/discord.module'
import { YoutubeService } from './service/youtube.service'

@Module({
  imports: [
    forwardRef(() => DiscordModule),
  ],
  providers: [
    YoutubeService,
  ],
  exports: [
    YoutubeService,
  ],
})
export class YoutubeModule { }
