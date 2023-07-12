import Bottleneck from 'bottleneck'

export const youtubeChannelLimiter = new Bottleneck({
  maxConcurrent: 3,
})

export const youtubeVideoChatLimiter = new Bottleneck({
  maxConcurrent: 3,
})
