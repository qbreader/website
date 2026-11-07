/**
 * A player has finished a division once they have answered every question in it.
 * @param {object} params
 * @param {Array} params.buzzes - the player's buzzes in the division
 * @param {number} params.questionCount - how many questions the division has
 * @returns {boolean}
 */
export default function hasFinished ({ buzzes, questionCount }) {
  return buzzes.length >= questionCount;
}
