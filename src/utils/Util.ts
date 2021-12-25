import { program } from 'commander'
import { CookieMap } from 'cookiefile'
import path from 'path'
import { APP_DEFAULT_COOKIES_PATH } from '../constants/app.constant'
import { logger as baseLogger } from '../logger'

const logger = baseLogger.child({ label: '[Util]' })

export class Util {
  public static splitArrayIntoChunk<T>(arr: T[], chunkSize: number) {
    return [...Array(Math.ceil(arr.length / chunkSize))]
      .map(() => arr.splice(0, chunkSize))
  }

  public static getCookies(): any[] {
    try {
      const domains = ['youtube.com']
      const cookiePath = program.getOptionValue('cookies') || path.join(__dirname, APP_DEFAULT_COOKIES_PATH)
      const map = new CookieMap(cookiePath)
      const cookies: any[] = Array.from(map.values())
        .filter((cookie: any) => domains.some((v) => cookie.domain.includes(v)))
      return cookies
    } catch (error) {
      logger.warn(`getCookies: ${error.message}`)
    }
    return []
  }
}
