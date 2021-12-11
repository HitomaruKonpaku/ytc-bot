import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import 'dotenv/config'
import { DISCORD_COMMANDS } from './constants/discord-commands.constant'

const commands = DISCORD_COMMANDS
  .map((v) => v.command)
  .map((command) => command.toJSON())

const token = process.env.DISCORD_TOKEN
const appId = process.env.DISCORD_APP_ID
const guildId = process.env.DISCORD_GUILD_ID
console.debug('token', token)
console.debug('appId', appId)
console.debug('guildId', guildId)

const rest = new REST({ version: '9' }).setToken(token)

if (guildId) {
  rest.put(Routes.applicationGuildCommands(appId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application guild commands.'))
    .catch(console.error)
}

rest.put(Routes.applicationCommands(appId), { body: commands })
  .then(() => console.log('Successfully registered application commands.'))
  .catch(console.error)
