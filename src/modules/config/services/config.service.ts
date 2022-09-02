import { Injectable } from '@nestjs/common'
import EventEmitter from 'events'
import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import { baseLogger } from '../../../logger'
import { ConfigEvent } from '../enums/config-event.enum'

@Injectable()
export class ConfigService extends EventEmitter {
  public config: Record<string, any> = {}

  private readonly logger = baseLogger.child({ context: ConfigService.name })

  constructor() {
    super()
    this.config = {}
    this.reloadConfig()
  }

  public reloadConfig() {
    this.loadConfig()
    this.logger.warn('config reloaded')
    this.emit(ConfigEvent.RELOAD)
  }

  public loadConfig() {
    let config: any

    try {
      const payload = readFileSync('config.yaml', 'utf-8')
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
}
