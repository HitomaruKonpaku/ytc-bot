import { readFileSync } from 'fs'
import yaml from 'js-yaml'

export interface YoutubeConfig {
  /**
   * Interval between channels fetch
   */
  pollInterval?: number

  /**
   * Channel ids to fetch
   */
  pollChannelIds?: string[]

  /**
   * Channel ids that can access membership content
   */
  memberChannelIds?: string[]
}

export interface TrackConfig {
  discordChannelId?: string
  allowReplay?: boolean
  allowNormalChat?: boolean
  allowMemberChat?: boolean
  userId?: string
  filterUserId?: string
  filterKeywords?: string[]
}

export interface Config {
  youtube?: YoutubeConfig
  tracks?: TrackConfig[]
}

const config: Config = {
  youtube: {
    pollInterval: 60000,
    pollChannelIds: [],
  },
  tracks: [],
}

try {
  const payload = readFileSync('config.yaml', 'utf-8')
  Object.assign(config || {}, yaml.load(payload))
  console.debug('config loaded')
} catch (error) {
  console.error('config error', error.message)
}

export { config }
