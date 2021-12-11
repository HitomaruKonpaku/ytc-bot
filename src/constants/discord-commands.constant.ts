import { AddCommand } from '../commands/discord/add.command'
import { PingCommand } from '../commands/discord/ping.command'
import { RemoveCommand } from '../commands/discord/remove.command'
import { WatchCommand } from '../commands/discord/watch.command'

export const DISCORD_COMMANDS = [
  PingCommand,
  WatchCommand,
  AddCommand,
  RemoveCommand,
]
