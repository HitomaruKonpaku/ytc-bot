import { YouTubeLiveChatBadgeRenderer } from './YouTubeLiveChatBadgeRenderer.interface'
import { YouTubeLiveChatMessage } from './YouTubeLiveChatMessage.interface'

export interface YouTubeLiveChatMessageRenderer {
  id: string
  timestampUsec: string
  authorExternalChannelId: string
  authorName?: {
    simpleText: string
  }
  authorBadges?: { liveChatAuthorBadgeRenderer: YouTubeLiveChatBadgeRenderer }[]
  purchaseAmountText?: {
    simpleText: string
  }
  message?: YouTubeLiveChatMessage

  [key: string]: any
}
