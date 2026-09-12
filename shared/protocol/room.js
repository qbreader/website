export const ROOM_MESSAGE_TYPE = Object.freeze({
  CLEAR_STATS: 'clear-stats',
  LEAVE: 'leave',
  SET_USERNAME: 'set-username',
  TIMER_UPDATE: 'timer-update'
});

/**
 * @typedef {typeof ROOM_MESSAGE_TYPE[keyof typeof ROOM_MESSAGE_TYPE]} RoomMessageType
 */
