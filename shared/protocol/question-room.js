export const QUESTION_CLIENT_MESSAGE_TYPE = Object.freeze({
  ALERT: 'alert',
  END_OF_SET: 'end-of-set',
  NO_QUESTIONS_FOUND: 'no-questions-found'
});

export const QUESTION_ROOM_MESSAGE_TYPE = Object.freeze({
  GIVE_ANSWER: 'give-answer',
  NEXT: 'next',
  SET_CATEGORIES: 'set-categories',
  SET_DIFFICULTIES: 'set-difficulties',
  SET_MAX_YEAR: 'set-max-year',
  SET_MIN_YEAR: 'set-min-year',
  SET_MODE: 'set-mode',
  SET_PACKET_NUMBERS: 'set-packet-numbers',
  SET_READING_SPEED: 'set-reading-speed',
  SET_SET_NAME: 'set-set-name',
  SET_STRICTNESS: 'set-strictness',
  TOGGLE_RANDOMIZE_ORDER: 'toggle-randomize-order',
  TOGGLE_SKIP: 'toggle-skip',
  TOGGLE_STANDARD_ONLY: 'toggle-standard-only',
  TOGGLE_TIMER: 'toggle-timer',
  UPLOAD_LOCAL_PACKET: 'upload-local-packet'
});

/**
 * @typedef {typeof QUESTION_CLIENT_MESSAGE_TYPE[keyof typeof QUESTION_CLIENT_MESSAGE_TYPE]} QuestionClientMessageType
 * @typedef {typeof QUESTION_ROOM_MESSAGE_TYPE[keyof typeof QUESTION_ROOM_MESSAGE_TYPE]} QuestionRoomMessageType
 */
