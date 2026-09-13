export const MULTIPLAYER_ROOM_MESSAGE_TYPE = Object.freeze({
  BAN: 'ban',
  CHAT: 'chat',
  CHAT_LIVE_UPDATE: 'chat-live-update',
  GIVE_ANSWER_LIVE_UPDATE: 'give-answer-live-update',
  TOGGLE_CONTROLLED: 'toggle-controlled',
  TOGGLE_LOCK: 'toggle-lock',
  TOGGLE_LOGIN_REQUIRED: 'toggle-login-required',
  TOGGLE_MUTE: 'toggle-mute',
  TOGGLE_PUBLIC: 'toggle-public',
  VOTEKICK_INIT: 'votekick-init',
  VOTEKICK_VOTE: 'votekick-vote'
});

/**
 * @typedef {typeof MULTIPLAYER_ROOM_MESSAGE_TYPE[keyof typeof MULTIPLAYER_ROOM_MESSAGE_TYPE]} MultiplayerRoomMessageType
 */
