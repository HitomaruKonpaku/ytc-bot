import path from 'path'
import winston, { format } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { LOGGER_DATE_PATTERN, LOGGER_DIR } from './constant/logger.constant'

function getPrintFormat() {
  return format.printf((info) => {
    const content = [
      info.timestamp,
      [
        `[${info.level}]`,
        info.context ? [info.context].flat().map((v) => `[${v}]`).join(' ') : '',
        info.message,
      ].filter((v) => v).join(' '),
      Object.keys(info.metadata).length ? JSON.stringify(info.metadata) : '',
    ].filter((v) => v).join(' | ')
    return content
  })
}

function getFileName() {
  return `${process.env.NODE_ENV || 'dev'}.%DATE%`
}

const consoleTransport = new winston.transports.Console({
  level: 'info',
  format: format.combine(
    format.colorize(),
    getPrintFormat(),
  ),
})

const logger = winston.createLogger({
  format: format.combine(
    format.timestamp(),
    format.metadata({ fillExcept: ['timestamp', 'level', 'message'] }),
    format((info) => Object.assign(info, { level: info.level.toUpperCase() }))(),
    format((info) => {
      const { metadata } = info
      if (metadata.context) {
        Object.assign(info, { context: metadata.context })
        delete metadata.context
      }
      return info
    })(),
  ),
  transports: [
    consoleTransport,
    new DailyRotateFile({
      level: 'verbose',
      format: format.combine(getPrintFormat()),
      datePattern: LOGGER_DATE_PATTERN,
      dirname: LOGGER_DIR,
      filename: `${getFileName()}.log`,
    }),
    new DailyRotateFile({
      level: 'error',
      format: format.combine(getPrintFormat()),
      datePattern: LOGGER_DATE_PATTERN,
      dirname: LOGGER_DIR,
      filename: `${getFileName()}_error.log`,
    }),
    new DailyRotateFile({
      level: 'silly',
      format: format.combine(getPrintFormat()),
      datePattern: LOGGER_DATE_PATTERN,
      dirname: LOGGER_DIR,
      filename: `${getFileName()}_all.log`,
    }),
  ],
})

const chatLogger = winston.createLogger({
  format: format.combine(
    format.timestamp(),
    format.metadata({ fillExcept: ['timestamp', 'level', 'message'] }),
    format((info) => Object.assign(info, { level: info.level.toUpperCase() }))(),
    format((info) => {
      const { metadata } = info
      if (metadata.context) {
        Object.assign(info, { context: metadata.context })
        delete metadata.context
      }
      return info
    })(),
  ),
  transports: [
    new DailyRotateFile({
      level: 'silly',
      format: format.combine(getPrintFormat()),
      datePattern: LOGGER_DATE_PATTERN,
      dirname: LOGGER_DIR,
      filename: 'chat_%DATE%.log',
    }),
  ],
})

const superchatLogger = (videoId: string, channelId?: string) => winston.createLogger({
  format: format.combine(
    format.timestamp(),
    format.metadata({ fillExcept: ['timestamp', 'level', 'message'] }),
    format((info) => Object.assign(info, { level: info.level.toUpperCase() }))(),
    format((info) => {
      const { metadata } = info
      if (metadata.context) {
        Object.assign(info, { context: metadata.context })
        delete metadata.context
      }
      return info
    })(),
  ),
  transports: [
    new winston.transports.File({
      level: 'silly',
      format: format.combine(getPrintFormat()),
      dirname: path.join(...[LOGGER_DIR, 'superchat', channelId].filter((v) => v)),
      filename: `${videoId}.log`,
    }),
  ],
})

function toggleDebugConsole() {
  consoleTransport.level = 'debug'
}

export { logger as baseLogger, chatLogger, logger, superchatLogger, toggleDebugConsole }
