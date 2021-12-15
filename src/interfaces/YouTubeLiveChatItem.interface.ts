import { YouTubeLiveChatMessageRenderer } from './YouTubeLiveChatMessageRenderer.interface'

export interface YouTubeLiveChatItem {
  liveChatTextMessageRenderer?: YouTubeLiveChatMessageRenderer
  liveChatPaidMessageRenderer?: YouTubeLiveChatMessageRenderer
  liveChatMembershipItemRenderer?: YouTubeLiveChatMessageRenderer
}
