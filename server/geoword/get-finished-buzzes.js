import hasFinished from './has-finished.js';

/**
 * Matches count only members who have finished, so results don't change while the rest of
 * the division plays.
 * @param {object} params
 * @param {Array<Object[]>} params.memberBuzzes - each team member's buzzes in the division
 * @param {number} params.questionCount - how many questions the division has
 * @returns {Object[]} the buzzes of the members who have finished
 */
export default function getFinishedBuzzes ({ memberBuzzes, questionCount }) {
  return memberBuzzes.filter(buzzes => hasFinished({ buzzes, questionCount })).flat();
}
