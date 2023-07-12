import { forwardRef, Module } from '@nestjs/common'
import { EnvironmentModule } from '../environment/environment.module'
import { YoutubeModule } from '../youtube/youtube.module'
import { DISCORD_ALL_COMMANDS } from './constant/discord-command.constant'
import { DiscordClientService } from './service/discord-client.service'
import { DiscordService } from './service/discord.service'

@Module({
  imports: [
    EnvironmentModule,
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
