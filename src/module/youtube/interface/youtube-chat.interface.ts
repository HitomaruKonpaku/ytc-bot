import {
  AddSuperChatItemAction,
  Masterchat,
  Events as MasterchatEvents,
} from 'masterchat'

export interface Events extends MasterchatEvents {
  superchats: (chats: AddSuperChatItemAction[], mc: Masterchat) => void;
  superchat: (chat: AddSuperChatItemAction, mc: Masterchat) => void;
}
