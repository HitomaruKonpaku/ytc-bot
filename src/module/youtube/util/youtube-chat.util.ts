import { SuperChatColor } from 'masterchat'

export class YoutubeChatUtil {
  public static toColorEmoji(color: SuperChatColor): string {
    const emojis: Record<SuperChatColor, string> = {
      blue: '🔵',
      lightblue: '🔵',
      green: '🟢',
      yellow: '🟡',
      orange: '🟠',
      magenta: '🟣',
      red: '🔴',
    }
    return emojis[color]
  }
}
