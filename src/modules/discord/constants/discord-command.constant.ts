import { ChatAddCommand } from '../commands/chat/chat-add.command'
import { ChatRemoveCommand } from '../commands/chat/chat-remove.command'

export const DISCORD_APP_COMMANDS = [
  ChatAddCommand,
  ChatRemoveCommand,
]

export const DISCORD_GUILD_COMMANDS = [
  // ChatAddCommand,
  // ChatRemoveCommand,
]

export const DISCORD_GLOBAL_COMMANDS = [
  // ChatAddCommand,
  // ChatRemoveCommand,
]

export const DISCORD_ALL_COMMANDS = [
  ChatAddCommand,
  ChatRemoveCommand,
]
