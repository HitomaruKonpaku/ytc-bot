export interface Channel {
  id?: string
  name?: string
  [key: string]: any
}

export interface YtChatConfig {
  /**
  * Filter chat message by some keywords
  */
  keywords: string[]

  /**
   * Channel specific config
   */
  channels: {
    [key: string]: {
      allowChannels?: Channel[]
    }
  }

  /**
   * Global allow channels
   */
  allowChannels: Channel[]

  /**
   * Global block channels
   */
  blockChannels: Channel[]
}

export interface Config {
  ytChat: YtChatConfig
}
