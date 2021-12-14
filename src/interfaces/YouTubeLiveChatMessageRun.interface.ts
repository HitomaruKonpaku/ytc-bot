export interface YouTubeLiveChatMessageRun {
  text?: string
  emoji?: {
    emojiId: string
    isCustomEmoji?: boolean
    shortcuts?: string[]
    searchTerms?: string[]
  }
}
