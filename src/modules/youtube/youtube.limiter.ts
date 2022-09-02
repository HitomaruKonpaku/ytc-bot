import Bottleneck from 'bottleneck'

export const youtubeChatAddLimiter = new Bottleneck({
  maxConcurrent: 1,
})
