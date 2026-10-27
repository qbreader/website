export function formatTime (seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

/**
 * Whether a tossup has a start time for every clue, so its clues can be jumped to.
 * @param {object} tossup
 * @returns {boolean}
 */
export function hasClueTimes ({ clues, clipBoundaries }) {
  return Array.isArray(clues) && Array.isArray(clipBoundaries) && clues.length === clipBoundaries.length;
}

/**
 * @param {object} buzz
 * @param {number} duration
 * @returns {number | null}
 */
export function getBuzzTime (buzz, duration) {
  const celerity = buzz.celerity ?? 0;
  return celerity > 0 ? (1 - celerity) * duration : null;
}

/**
 * @param {number[]} starts
 * @param {number} time
 * @returns {number}
 */
export function getClueAt (starts, time) {
  return Math.max(0, starts.findLastIndex(start => start <= time));
}

/**
 * @param {object} buzz
 * @param {object} tossup - with clue times and a duration
 * @returns {number} the buzz's clue, or the number of clues if it came after the audio ended
 */
export function getBuzzClue (buzz, { clipBoundaries, duration }) {
  const time = getBuzzTime(buzz, duration);
  return time === null ? clipBoundaries.length : getClueAt(clipBoundaries, time);
}
