import { YouTubeMetaAuthor } from './YouTubeMetaAuthor.interface'
import { YouTubeMetaPublication } from './YouTubeMetaPublication.interface'

export interface YouTubeMetaVideo {
  url?: string
  name?: string
  description?: string
  paid?: string
  channelId?: string
  videoId?: string
  duration?: string
  unlisted?: string
  author?: YouTubeMetaAuthor
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
  publication?: YouTubeMetaPublication
}
