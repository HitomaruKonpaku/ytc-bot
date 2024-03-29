import { NestFactory } from '@nestjs/core'
import 'dotenv/config'
import 'module-alias/register'
import { AppModule } from './app.module'
import { AppService } from './app.service'
import { logger, toggleDebugConsole } from './logger'

async function bootstrap() {
  // process.env.NO_COLOR = '1'

  logger.info(Array(50).fill('=').join(''))
  if (!process.env.NODE_ENV) {
    toggleDebugConsole()
  }

  const app = await NestFactory.createApplicationContext(AppModule)
  const appService = app.get(AppService)
  await appService.start()
}

bootstrap()
