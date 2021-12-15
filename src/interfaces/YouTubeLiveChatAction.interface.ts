import { YouTubeLiveChatItem } from './YouTubeLiveChatItem.interface'

export interface YouTubeLiveChatAction {
  replayChatItemAction?: any

  addChatItemAction?: { item?: YouTubeLiveChatItem }

  addBannerToLiveChatCommand?: any

  addLiveChatTickerItemAction?: any

  markChatItemAsDeletedAction?: any

  markChatItemsByAuthorAsDeletedAction?: any

  replaceChatItemAction?: any

  replaceLiveChatRendererAction?: any

  showLiveChatTooltipCommand?: any

  clickTrackingParams?: any
}
