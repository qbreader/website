export const BONUS_ROOM_MESSAGE_TYPE = Object.freeze({
  END_CURRENT_BONUS: 'end-current-bonus',
  GIVE_BONUS_ANSWER: 'give-bonus-answer',
  REVEAL_LEADIN: 'reveal-leadin',
  REVEAL_NEXT_ANSWER: 'reveal-next-answer',
  REVEAL_NEXT_PART: 'reveal-next-part',
  START_BONUS_ANSWER: 'start-bonus-answer',
  START_NEXT_BONUS: 'start-next-bonus',
  TOGGLE_BONUS_PART: 'toggle-bonus-part',
  TOGGLE_READ_BONUSES_LIKE_TOSSUPS: 'toggle-read-bonuses-like-tossups',
  TOGGLE_THREE_PART_BONUSES: 'toggle-three-part-bonuses',
  UPDATE_BONUS_QUESTION: 'update-bonus-question'
});

/**
 * @typedef {typeof BONUS_ROOM_MESSAGE_TYPE[keyof typeof BONUS_ROOM_MESSAGE_TYPE]} BonusRoomMessageType
 */
