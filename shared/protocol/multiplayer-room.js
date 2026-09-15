export const MULTIPLAYER_CLIENT_MESSAGE_TYPE = Object.freeze({
  ADMIN_LOCK: 'admin-lock',
  CONFIRM_BAN: 'confirm-ban',
  CONNECTION_ACKNOWLEDGED: 'connection-acknowledged',
  CONNECTION_ACKNOWLEDGED_QUERY: 'connection-acknowledged-query',
  CONNECTION_ACKNOWLEDGED_QUESTION: 'connection-acknowledged-question',
  ENFORCING_REMOVAL: 'enforcing-removal',
  ERROR: 'error',
  FORCE_USERNAME: 'force-username',
  INITIATED_VK: 'initiated-vk',
  JOIN: 'join',
  MUTE_PLAYER: 'mute-player',
  NO_POINTS_VOTEKICK_ATTEMPT: 'no-points-votekick-attempt',
  OWNER_CHANGE: 'owner-change',
  SUCCESSFUL_VK: 'successful-vk'
});

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
