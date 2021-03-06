import { program } from 'commander'
import 'dotenv/config'
import { discord } from './clients/discord'
import { logger } from './logger'
import { configManager } from './modules/ConfigManager'
import { YouTubeChat } from './modules/YouTubeChat'
import { YouTubeUtil } from './utils/YouTubeUtil'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json')

program
  .version(pkg.version)
  .option('-d, --debug', 'Show debug logs')
  .option('-c, --cookies <FILE_PATH>', 'File to load cookies, default to ./cookies.txt')
  .command('download <URL>')
  .action((url) => {
    new YouTubeChat(YouTubeUtil.getVideoId(url)).start()
  })

program.action(async (args) => {
  if (args.debug) {
    // eslint-disable-next-line dot-notation
    const transports = logger.transports.filter((v) => v['name'] === 'console')
    transports.forEach((transport) => {
      // eslint-disable-next-line no-param-reassign
      transport.level = 'silly'
    })
  }

  configManager.load()
  await discord.start()
})

program.parse()
