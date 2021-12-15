import { YouTubeLiveChatBadgeRenderer } from './YouTubeLiveChatBadgeRenderer.interface'
import { YouTubeLiveChatMessage } from './YouTubeLiveChatMessage.interface'
import { YouTubeLiveChatSimpleText } from './YouTubeLiveChatSimpleText'

export interface YouTubeLiveChatMessageRenderer {
  id: string
  timestampUsec: string
  authorExternalChannelId: string
  authorName?: YouTubeLiveChatSimpleText
  authorBadges?: { liveChatAuthorBadgeRenderer: YouTubeLiveChatBadgeRenderer }[]
  purchaseAmountText?: YouTubeLiveChatSimpleText
  headerPrimaryText?: YouTubeLiveChatMessage
  headerSubtext?: YouTubeLiveChatMessage
  message?: YouTubeLiveChatMessage

  [key: string]: any
}
