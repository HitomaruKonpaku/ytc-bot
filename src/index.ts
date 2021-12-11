import { program } from 'commander'
import 'dotenv/config'
import { discord } from './clients/discord'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json')

program
  .version(pkg.version)

program.action(() => {
  discord.start()
})

program.parse()
