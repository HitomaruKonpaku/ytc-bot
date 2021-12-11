import { YouTubeAuthor } from './YouTubeAuthor.interface'

export interface YouTubeVideoMeta {
  url?: string
  name?: string
  description?: string
  paid?: string
  channelId?: string
  videoId?: string
  duration?: string
  unlisted?: string
  author?: YouTubeAuthor
  thumbnailUrl?: string
  embedUrl?: string
  playerType?: string
  width?: string
  height?: string
  isFamilyFriendly?: string
  regionsAllowed?: string
  interactionCount?: string
  datePublished?: string
  uploadDate?: string
  genre?: string
}
