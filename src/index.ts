import { program } from 'commander'
import 'dotenv/config'
import { discord } from './clients/discord'
import { logger } from './logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json')

program
  .version(pkg.version)

program.action((args) => {
  if (args.debug) {
    // eslint-disable-next-line dot-notation
    const transports = logger.transports.filter((v) => v['name'] === 'console')
    transports.forEach((transport) => {
      // eslint-disable-next-line no-param-reassign
      transport.level = 'silly'
    })
  }

  discord.start()
})

program.parse()
