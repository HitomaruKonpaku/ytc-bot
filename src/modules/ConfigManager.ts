import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import winston from 'winston'
import { APP_CONFIG_PATH } from '../constants/app.constant'
import { Config } from '../interfaces/App.interface'
import { logger as baseLogger } from '../logger'

class ConfigManager {
  public config: Config

  private logger: winston.Logger

  constructor() {
    this.logger = baseLogger.child({ label: '[ConfigManager]' })
    this.config = {
      ytChat: {
        keywords: [],
        channels: {},
        allowChannels: [],
        blockChannels: [],
      },
    }
  }

  public load() {
    const configPath = path.join(__dirname, APP_CONFIG_PATH)
    if (configPath) {
      try {
        Object.assign(this.config, JSON.parse(readFileSync(configPath, 'utf-8')))
      } catch (error) {
        this.logger.warn(`load: ${error.message}`)
      }
    }
    return this.config
  }

  public save() {
    const configPath = path.join(__dirname, APP_CONFIG_PATH)
    writeFileSync(configPath, JSON.stringify(this.config, null, 2))
    return this.config
  }
}

export const configManager = new ConfigManager()
