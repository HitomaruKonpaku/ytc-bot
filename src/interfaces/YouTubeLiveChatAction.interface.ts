import { YouTubeLiveChatMessageRenderer } from './YouTubeLiveChatMessageRenderer.interface'

export interface YouTubeAction {
  replayChatItemAction?: any

  addChatItemAction?: {
    item?: {
      liveChatTextMessageRenderer?: YouTubeLiveChatMessageRenderer
      liveChatPaidMessageRenderer?: YouTubeLiveChatMessageRenderer
    }
  }

  addBannerToLiveChatCommand?: any

  addLiveChatTickerItemAction?: any

  markChatItemAsDeletedAction?: any

  markChatItemsByAuthorAsDeletedAction?: any

  replaceChatItemAction?: any

  replaceLiveChatRendererAction?: any

  showLiveChatTooltipCommand?: any

  clickTrackingParams?: any
}
