import { ChatAddCommand } from '../command/chat/chat-add.command'
import { ChatRefreshCommand } from '../command/chat/chat-refresh.command'

export const DISCORD_APP_COMMANDS = [
  ChatAddCommand,
  ChatRefreshCommand,
]

export const DISCORD_GUILD_COMMANDS = [
  // ChatAddCommand,
  // ChatRefreshCommand,
]

export const DISCORD_GLOBAL_COMMANDS = [
  ChatAddCommand,
  ChatRefreshCommand,
]

export const DISCORD_ALL_COMMANDS = [
  ChatAddCommand,
  ChatRefreshCommand,
]
