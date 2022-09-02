import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '../config/config.module'
import { YoutubeModule } from '../youtube/youtube.module'
import { DISCORD_ALL_COMMANDS } from './constants/discord-command.constant'
import { DiscordClientService } from './services/discord-client.service'
import { DiscordService } from './services/discord.service'

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => YoutubeModule),
  ],
  providers: [
    DiscordService,
    DiscordClientService,
    ...DISCORD_ALL_COMMANDS,
  ],
  exports: [
    DiscordService,
  ],
})
export class DiscordModule { }
