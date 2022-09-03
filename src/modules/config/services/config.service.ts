import { Injectable } from '@nestjs/common'
import { CookieMap } from 'cookiefile'
import EventEmitter from 'events'
import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import { APP_CONFIG_PATH, APP_COOKIES_PATH } from '../../../constants/app.constant'
import { baseLogger } from '../../../logger'
import { ConfigEvent } from '../enums/config-event.enum'

interface Cookie {
  name: string
  value: string
  domain: string
  [key: string]: string
}

@Injectable()
export class ConfigService extends EventEmitter {
  public config: Record<string, any> = {}
  public cookies: Cookie[] = []

  private readonly logger = baseLogger.child({ context: ConfigService.name })

  constructor() {
    super()
    this.config = {}
    this.cookies = []
    this.reloadConfig()
  }

  public getConfig() {
    return { ...this.config }
  }

  public getCookies() {
    return [...this.cookies]
  }

  public reloadConfig() {
    this.loadConfig()
    this.loadCookies()
    this.logger.warn('config reloaded')
    this.emit(ConfigEvent.RELOAD)
  }

  public loadConfig() {
    this.logger.debug('loadConfig')
    let config: any

    try {
      const file = path.join(__dirname, APP_CONFIG_PATH)
      const payload = readFileSync(file, 'utf-8')
      config = Object.assign(config || {}, yaml.load(payload))
    } catch (error) {
      this.logger.warn(`load: ${error.message}`)
    }

    // if (!config) {
    //   try {
    //     const payload = readFileSync('config.json', 'utf-8')
    //     config = Object.assign(config || {}, JSON.parse(payload))
    //   } catch (error) {
    //     this.logger.warn(`load: ${error.message}`)
    //   }
    // }

    this.config = config || {}
    return this.config
  }

  public loadCookies() {
    this.logger.debug('loadCookies')
    try {
      const file = path.join(__dirname, APP_COOKIES_PATH)
      const domains = ['youtube.com']
      const map = new CookieMap(file)
      const cookies: any[] = Array.from(map.values())
        .filter((cookie: any) => domains.some((v) => cookie.domain.includes(v)))
      this.cookies = cookies
    } catch (error) {
      this.logger.warn(`loadCookies: ${error.message}`)
    }
  }
}
