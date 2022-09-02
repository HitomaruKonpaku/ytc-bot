import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '../config/config.module'
import { DiscordModule } from '../discord/discord.module'
import { YoutubeService } from './services/youtube.service'

@Module({
  imports: [
    ConfigModule,
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
