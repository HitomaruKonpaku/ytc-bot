import { YouTubeLiveChatRenderer } from './YouTubeLiveChatRenderer.interface'

export interface YouTubeAction {
  replayChatItemAction?: any

  addChatItemAction?: {
    item?: {
      liveChatTextMessageRenderer?: YouTubeLiveChatRenderer
      liveChatPaidMessageRenderer?: YouTubeLiveChatRenderer
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
