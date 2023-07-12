import { Module } from '@nestjs/common'
import { AppService } from './app.service'
import { DiscordModule } from './module/discord/discord.module'
import { EnvironmentModule } from './module/environment/environment.module'
import { YoutubeModule } from './module/youtube/youtube.module'

@Module({
  imports: [
    EnvironmentModule,
    DiscordModule,
    YoutubeModule,
  ],
  providers: [AppService],
})
export class AppModule { }
