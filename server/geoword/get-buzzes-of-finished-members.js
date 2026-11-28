import hasFinished from './has-finished.js';

/**
 * @param {object} params
 * @param {Array<Object[]>} params.memberBuzzes - each team member's buzzes in the division
 * @param {number} params.questionCount - how many questions the division has
 */
export default function getBuzzesOfFinishedMembers ({ memberBuzzes, questionCount }) {
  return memberBuzzes.filter(buzzes => hasFinished({ buzzes, questionCount })).flat();
}
