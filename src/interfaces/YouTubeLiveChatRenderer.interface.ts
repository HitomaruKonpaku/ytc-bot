import { YouTubeLiveChatMessage } from './YouTubeLiveChatMessage.interface'

export interface YouTubeLiveChatRenderer {
  id: string
  timestampUsec: string
  authorExternalChannelId: string
  authorName?: {
    simpleText: string
  }
  purchaseAmountText?: {
    simpleText: string
  }
  message?: YouTubeLiveChatMessage

  [key: string]: any
}
