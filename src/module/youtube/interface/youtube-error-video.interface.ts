import { ErrorCode } from 'masterchat'

export interface YoutubeErrorVideo {
  videoId: string
  channelId: string
  code: ErrorCode
}
