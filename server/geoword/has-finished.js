/**
 * A player has finished a division once they have answered every question in it. Team
 * standings and the team view both use this, so a member counts as finished in the same
 * way in each.
 * @param {number} answeredCount - how many of the division's questions the player has buzzed on
 * @param {number} questionCount - how many questions the division has
 * @returns {boolean}
 */
export default function hasFinished (answeredCount, questionCount) {
  return answeredCount >= questionCount;
}
