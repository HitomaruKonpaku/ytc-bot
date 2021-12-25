/* eslint-disable max-len */
import axios from 'axios'
import cheerio from 'cheerio'
import { createHash } from 'crypto'
import { YouTubeMetaVideo } from '../interfaces/meta/YouTubeMetaVideo.interface'
import { YouTubeLiveChatAction } from '../interfaces/YouTubeLiveChatAction.interface'
import { YouTubeLiveChatContinuation } from '../interfaces/YouTubeLiveChatContinuation.interface'
import { YouTubeLiveChatContinuationData } from '../interfaces/YouTubeLiveChatContinuationData.interface'
import { YouTubeLiveChatMessageRenderer } from '../interfaces/YouTubeLiveChatMessageRenderer.interface'
import { logger as baseLogger } from '../logger'
import { Util } from './Util'

const logger = baseLogger.child({ label: '[YouTubeUtil]' })

export class YouTubeUtil {
  public static getOrigin() {
    return 'https://www.youtube.com'
  }

  /**
   * @see https://gist.github.com/takien/4077195
   */
  public static getVideoId(url: string): string {
    const arr = url.split(/(vi\/|v%3D|v=|\/v\/|youtu\.be\/|\/embed\/)/)
    const id = undefined !== arr[2] ? arr[2].split(/[^\w-]/i)[0] : arr[0]
    return id
  }

  public static getVideoUrl(id: string) {
    return `https://youtu.be/${id}`
  }

  public static async getVideoPage(id: string, headers: Record<string, string>): Promise<string> {
    const url = `https://www.youtube.com/watch?v=${id}`
    const { data } = await axios.get(url, { headers })
    return data
  }

  public static async getInitLiveChat(id: string, headers: Record<string, string>): Promise<string> {
    const url = `https://www.youtube.com/live_chat?v=${id}`
    const { data } = await axios.get(url, { headers })
    return data
  }

  public static async getNextLiveChat(key: string, context: Record<string, any>, continuation: string, headers: Record<string, string>): Promise<any> {
    const url = `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${key}`
    const body = { context, continuation }
    const { data } = await axios.post(url, body, { headers })
    return data
  }

  public static async getInitLiveChatReplay(continuation: string, headers: Record<string, string>): Promise<string> {
    const url = `https://www.youtube.com/live_chat_replay?continuation=${continuation}`
    const { data } = await axios.get(url, { headers })
    return data
  }

  public static async getNextLiveChatReplay(key: string, context: Record<string, any>, continuation: string, headers: Record<string, string>): Promise<any> {
    const url = `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat_replay?key=${key}`
    const body = { context, continuation }
    const { data } = await axios.post(url, body, { headers })
    return data
  }

  public static getSAPISIDHASH() {
    const cookies = Util.getCookies()
    const SAPISID = cookies.find((cookie) => cookie.cookieName === 'SAPISID')?.value
    if (!SAPISID) {
      logger.warn('SAPISID not found')
      return ''
    }
    const time = Math.round(Date.now() / 1000)
    const hash = createHash('sha1')
      .update([time, SAPISID, this.getOrigin()].join(' '))
      .digest('hex')
    const SAPISIDHASH = `SAPISIDHASH ${time}_${hash}`
    return SAPISIDHASH
  }

  public static getVideoMeta(payload: string) {
    const $ = cheerio.load(payload)
    const baseNode = Array.from($('body *[itemid][itemtype]'))[0]
    if (!baseNode) {
      logger.warn('Meta node not found')
      return {}
    }

    const getMeta = (node: any, meta = {}) => {
      node.childNodes.forEach((childNode: any) => {
        const { attribs } = childNode
        const key: string = attribs.itemprop
        if (!key) {
          return
        }
        if (childNode.childNodes.length) {
          // eslint-disable-next-line no-param-reassign
          meta[key] = {}
          getMeta(childNode, meta[key])
          return
        }
        const value: string = attribs.href || attribs.content
        // eslint-disable-next-line no-param-reassign
        meta[key] = value
      })
      return meta
    }

    const meta = getMeta(baseNode)
    return meta as YouTubeMetaVideo
  }

  public static getYtInitialData(payload: string): any {
    try {
      const $ = cheerio.load(payload)
      const scripts = $('script').toArray()
      const nodes = scripts.map((v: any) => v.children).flat()
      const node = nodes.find((v) => v.data.includes('ytInitialData'))
      const { data } = node
      const json = data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1)
      const obj = JSON.parse(json)
      return obj
    } catch (error) {
      logger.error(`getYtInitialData: ${error.message}`)
    }
    return null
  }

  public static getYtConfig(payload: string): any {
    try {
      const $ = cheerio.load(payload)
      const scripts = $('script').toArray()
      const nodes = scripts.map((v: any) => v.children).flat()
      const node = nodes.find((v) => v.data.includes('ytcfg.set({'))
      const { data } = node
      const json = data.substring(data.indexOf('{'), data.lastIndexOf('}') + 1)
      const obj = JSON.parse(json)
      return obj
    } catch (error) {
      logger.error(`getYtConfig: ${error.message}`)
    }
    return null
  }

  public static getContinuationData(continuations: YouTubeLiveChatContinuation[]): YouTubeLiveChatContinuationData {
    const continuationData = continuations
      .map((v) => v?.timedContinuationData || v?.invalidationContinuationData || v?.liveChatReplayContinuationData)
      .find((v) => v)
    if (continuationData) {
      delete continuationData.clickTrackingParams
      delete continuationData.invalidationId
    }
    return continuationData
  }

  public static getCleanActions(obj: YouTubeLiveChatAction[]) {
    if (!obj) {
      return obj
    }
    try {
      const keys = [
        'clickTrackingParams',
        'contextMenuAccessibility',
        'contextMenuEndpoint',
        'trackingParams',
      ]
      const newObj = JSON.parse(JSON.stringify(obj, (key, value) => (!keys.includes(key) ? value : undefined))) as YouTubeLiveChatAction[]
      return newObj
    } catch (error) {
      logger.error(`getCleanActions: ${error.message}`, obj)
      return obj
    }
  }

  public static getChatAuthorChannelId(renderer: YouTubeLiveChatMessageRenderer): string {
    const text = renderer.authorExternalChannelId || null
    return text
  }

  public static getChatAuthorName(renderer: YouTubeLiveChatMessageRenderer): string {
    const text = renderer.authorName?.simpleText || null
    return text
  }

  public static getChatMessage(renderer: YouTubeLiveChatMessageRenderer): string {
    const runs = renderer.message?.runs
    if (!runs?.length) {
      return ''
    }
    const text = runs
      .reduce((pv, cv) => {
        let chunk = cv.emoji?.isCustomEmoji ? cv.emoji?.shortcuts?.[0] : cv.emoji?.emojiId
        chunk = chunk || cv.text || ''
        const msg = [pv, chunk].join(' ')
        return msg
      }, '')
      .trim()
    return text
  }

  public static getChatPurchaseAmount(renderer: YouTubeLiveChatMessageRenderer): string {
    const text = renderer.purchaseAmountText?.simpleText || null
    return text
  }

  public static isChannelOwner(renderer: YouTubeLiveChatMessageRenderer) {
    return this.hasBadgeType(renderer, 'OWNER')
  }

  public static isChannelModerator(renderer: YouTubeLiveChatMessageRenderer) {
    return this.hasBadgeType(renderer, 'MODERATOR')
  }

  public static hasBadgeType(renderer: YouTubeLiveChatMessageRenderer, type: string) {
    const isValid = !!renderer.authorBadges?.some((v) => v.liveChatAuthorBadgeRenderer?.icon?.iconType === type.toUpperCase())
    return isValid
  }

  public static buildMessageContent(
    renderer: YouTubeLiveChatMessageRenderer,
    options?: {
      logger?: boolean,
      isPinned?: boolean,
      isTranslation?: boolean,
    },
  ) {
    let content = ''
    if (this.isChannelOwner(renderer)) {
      content += '▶️'
    }
    if (this.isChannelModerator(renderer)) {
      content += '🔧'
    }
    if (options?.isPinned) {
      content += '📌'
    }
    if (options?.isTranslation) {
      content += '💬'
    }
    content += ` ${this.getChatAuthorName(renderer)}: `
    if (this.getChatPurchaseAmount(renderer)) {
      content += `[${this.getChatPurchaseAmount(renderer)}] `
    }
    content += this.getChatMessage(renderer)
    content = content.trim()
    if (options?.logger) {
      logger.debug('buildMessageContent', {
        authorChannelId: this.getChatAuthorChannelId(renderer),
        authorChannelName: this.getChatAuthorName(renderer),
        content,
      })
    }
    return content
  }
}
