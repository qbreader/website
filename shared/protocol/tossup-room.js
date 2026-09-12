export const TOSSUP_ROOM_MESSAGE_TYPE = Object.freeze({
  BUZZ: 'buzz',
  END_CURRENT_TOSSUP: 'end-current-tossup',
  GIVE_ANSWER_LIVE_UPDATE: 'give-answer-live-update',
  GIVE_TOSSUP_ANSWER: 'give-tossup-answer',
  LOST_BUZZER_RACE: 'lost-buzzer-race',
  PAUSE: 'pause',
  REVEAL_TOSSUP_ANSWER: 'reveal-tossup-answer',
  START_NEXT_TOSSUP: 'start-next-tossup',
  TOGGLE_POWERMARK_ONLY: 'toggle-powermark-only',
  TOGGLE_REBUZZ: 'toggle-rebuzz',
  TOGGLE_STOP_ON_POWER: 'toggle-stop-on-power',
  UPDATE_QUESTION: 'update-question'
});

/**
 * @typedef {typeof TOSSUP_ROOM_MESSAGE_TYPE[keyof typeof TOSSUP_ROOM_MESSAGE_TYPE]} TossupRoomMessageType
 */
