export const TOSSUP_CLIENT_MESSAGE_TYPE = Object.freeze({
  END_CURRENT_TOSSUP: 'end-current-tossup',
  GIVE_ANSWER_LIVE_UPDATE: 'give-answer-live-update',
  GIVE_TOSSUP_ANSWER: 'give-tossup-answer',
  LOST_BUZZER_RACE: 'lost-buzzer-race',
  REVEAL_TOSSUP_ANSWER: 'reveal-tossup-answer',
  START_NEXT_TOSSUP: 'start-next-tossup',
  UPDATE_QUESTION: 'update-question'
});

export const TOSSUP_ROOM_MESSAGE_TYPE = Object.freeze({
  BUZZ: 'buzz',
  PAUSE: 'pause',
  TOGGLE_POWERMARK_ONLY: 'toggle-powermark-only',
  TOGGLE_REBUZZ: 'toggle-rebuzz',
  TOGGLE_STOP_ON_POWER: 'toggle-stop-on-power'
});

/**
 * @typedef {typeof TOSSUP_CLIENT_MESSAGE_TYPE[keyof typeof TOSSUP_CLIENT_MESSAGE_TYPE]} TossupClientMessageType
 * @typedef {typeof TOSSUP_ROOM_MESSAGE_TYPE[keyof typeof TOSSUP_ROOM_MESSAGE_TYPE]} TossupRoomMessageType
 */
