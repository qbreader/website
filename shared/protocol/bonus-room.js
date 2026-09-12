export const BONUS_CLIENT_MESSAGE_TYPE = Object.freeze({
  END_CURRENT_BONUS: 'end-current-bonus',
  GIVE_BONUS_ANSWER: 'give-bonus-answer',
  REVEAL_LEADIN: 'reveal-leadin',
  REVEAL_NEXT_ANSWER: 'reveal-next-answer',
  REVEAL_NEXT_PART: 'reveal-next-part',
  START_NEXT_BONUS: 'start-next-bonus',
  UPDATE_BONUS_QUESTION: 'update-bonus-question'
});

export const BONUS_ROOM_MESSAGE_TYPE = Object.freeze({
  START_BONUS_ANSWER: 'start-bonus-answer',
  TOGGLE_BONUS_PART: 'toggle-bonus-part',
  TOGGLE_READ_BONUSES_LIKE_TOSSUPS: 'toggle-read-bonuses-like-tossups',
  TOGGLE_THREE_PART_BONUSES: 'toggle-three-part-bonuses'
});

/**
 * @typedef {typeof BONUS_CLIENT_MESSAGE_TYPE[keyof typeof BONUS_CLIENT_MESSAGE_TYPE]} BonusClientMessageType
 * @typedef {typeof BONUS_ROOM_MESSAGE_TYPE[keyof typeof BONUS_ROOM_MESSAGE_TYPE]} BonusRoomMessageType
 */
