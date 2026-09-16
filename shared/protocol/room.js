export const CLIENT_MESSAGE_TYPE = Object.freeze({
  LEAVE: 'leave',
  TIMER_UPDATE: 'timer-update'
});

export const ROOM_MESSAGE_TYPE = Object.freeze({
  CLEAR_STATS: 'clear-stats',
  SET_USERNAME: 'set-username'
});

/**
 * @typedef {typeof ROOM_MESSAGE_TYPE[keyof typeof ROOM_MESSAGE_TYPE]} RoomMessageType
 */
