import { YouTubeLiveChatContinuationData } from './YouTubeLiveChatContinuationData.interface'

export interface YouTubeLiveChatContinuation {
  timedContinuationData?: YouTubeLiveChatContinuationData
  invalidationContinuationData?: YouTubeLiveChatContinuationData
  liveChatReplayContinuationData?: YouTubeLiveChatContinuationData

  [key: string]: any
}
