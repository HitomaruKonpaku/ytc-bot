import { YouTubeLiveChatMessageRun } from './YouTubeLiveChatMessageRun.interface'
import { YouTubeLiveChatSimpleText } from './YouTubeLiveChatSimpleText'

export interface YouTubeLiveChatMessage extends YouTubeLiveChatSimpleText {
  runs?: YouTubeLiveChatMessageRun[]
}
