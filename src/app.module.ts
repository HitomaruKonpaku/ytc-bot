import { Module } from '@nestjs/common'
import { AppService } from './app.service'
import { ConfigModule } from './modules/config/config.module'
import { DiscordModule } from './modules/discord/discord.module'
import { YoutubeModule } from './modules/youtube/youtube.module'

@Module({
  imports: [
    ConfigModule,
    DiscordModule,
    YoutubeModule,
  ],
  providers: [AppService],
})
export class AppModule { }
