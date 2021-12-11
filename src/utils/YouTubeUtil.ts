/* eslint-disable max-len */
import axios from 'axios'
import cheerio from 'cheerio'
import { YouTubeVideoMeta } from '../interfaces/meta/YouTubeVideoMeta.interface'
import { logger as baseLogger } from '../logger'

const logger = baseLogger.child({ label: '[YouTubeUtil]' })

export class YouTubeUtil {
  public static getVideoId(url: string): string {
    const pattern = /^(?:(?:https:\/\/youtu\.be\/)|(https:\/\/www\.youtube\.com\/watch\?v=)){0,1}[\w-]{11}$/g
    if (!pattern.test(url)) {
      throw new Error('Invalid YouTube URL')
    }
    const id = url.slice(-11)
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
    return meta as YouTubeVideoMeta
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

  public static getContinuationData(continuations: any[]): any {
    const continuationData = continuations
      .map((v) => v?.timedContinuationData || v?.invalidationContinuationData || v?.liveChatReplayContinuationData)
      .find((v) => v)
    if (continuationData) {
      delete continuationData.clickTrackingParams
      delete continuationData.invalidationId
    }
    return continuationData
  }

  public static getCleanActions(obj: any) {
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
      const newObj = JSON.parse(JSON.stringify(obj, (key, value) => (!keys.includes(key) ? value : undefined)))
      return newObj
    } catch (error) {
      logger.error(`getCleanActions: ${error.message}`, obj)
      return obj
    }
  }

  public static getChatAuthorChannelId(renderer: any): string {
    const text = renderer.authorExternalChannelId || null
    return text
  }

  public static getChatAuthorName(renderer: any): string {
    const text = renderer.authorName?.simpleText || null
    return text
  }

  public static getChatMessage(renderer: any): string {
    const runs = renderer.message?.runs as any[]
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

  public static getChatPurchaseAmount(renderer: any): string {
    const text = renderer.purchaseAmountText?.simpleText || null
    return text
  }
}
