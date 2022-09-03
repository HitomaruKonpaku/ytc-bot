import { createHash } from 'crypto'

export class YoutubeUtils {
  public static getChannelUrl(id: string) {
    return `https://www.youtube.com/channel/${id}`
  }

  public static getVideoUrl(id: string) {
    return `https://www.youtube.com/watch?v=${id}`
  }

  public static genAuthToken(sid: string, origin: string): string {
    return `SAPISIDHASH ${this.genSash(sid, origin)}`
  }

  private static genSash(sid: string, origin: string): string {
    const now = Math.floor(new Date().getTime() / 1E3)
    const payload = [now, sid, origin]
    const digest = this.sha1Digest(payload.join(' '))
    return [now, digest].join('_')
  }

  private static sha1Digest(payload: string): string {
    const hash = createHash('sha1')
      .update(payload)
      .digest('hex')
    return hash.toString()
  }
}
