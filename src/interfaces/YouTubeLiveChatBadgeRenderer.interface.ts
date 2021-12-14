export interface YouTubeLiveChatBadgeRenderer {
  tooltip: string
  icon?: {
    iconType: string
  }
  customThumbnail?: {
    thumbnails?: { url: string }[]
  }
}
