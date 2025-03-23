export const MIN_YEAR = 2000;
export const MAX_YEAR = 2025;
export const DEFAULT_MIN_YEAR = 2010;
export const DEFAULT_MAX_YEAR = 2025;

export const DIFFICULTIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const ANSWER_TIME_LIMIT = 10; // time to give answer after buzzing
export const DEAD_TIME_LIMIT = 5; // time to buzz after question is read

export const MODE_ENUM = Object.freeze({
  SET_NAME: 'select by set name',
  RANDOM: 'random questions',
  STARRED: 'starred questions',
  LOCAL: 'local packet'
});

export const BONUS_PROGRESS_ENUM = Object.freeze({
  NOT_STARTED: 0,
  READING: 1,
  LAST_PART_REVEALED: 2
});

export const TOSSUP_PROGRESS_ENUM = Object.freeze({
  NOT_STARTED: 0,
  READING: 1,
  ANSWER_REVEALED: 2
});
