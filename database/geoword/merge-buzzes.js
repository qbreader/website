/**
 * Decides which of a team's buzzes counts on a single question.
 *
 * Teammates play asynchronously, so "first" cannot mean wall-clock time. It means
 * earliest within the question, which is the highest celerity - celerity is
 * `1 - currentTime / duration`, so a buzz early in the audio is close to 1.
 *
 * The strategy is a parameter so the scoring rule can change without touching
 * callers. `earliestBuzz` reproduces live quizbowl: whoever buzzes first locks out
 * their teammates, and the team lives with the result even if it is a neg and a
 * teammate would have converted later.
 */

/**
 * @typedef {Object} Buzz
 * @property {number} celerity
 * @property {number} points
 * @property {number} questionNumber
 * @property {ObjectId} user_id
 */

/**
 * Live quizbowl lockout: the earliest buzz counts, right or wrong.
 * @param {Buzz[]} buzzes - every teammate's buzz on one question; never empty
 * @returns {Buzz}
 */
export function earliestBuzz (buzzes) {
  return buzzes.reduce((earliest, buzz) => {
    if (buzz.celerity !== earliest.celerity) {
      return buzz.celerity > earliest.celerity ? buzz : earliest;
    }
    // Exact ties are unlikely on a float, but break them deterministically so that
    // standings don't depend on the order documents come back from the database.
    return String(buzz.user_id) < String(earliest.user_id) ? buzz : earliest;
  });
}

/**
 * The team's best result on the question, ignoring who was first.
 * Not used yet - kept as a second strategy so the seam above is real.
 * @param {Buzz[]} buzzes - every teammate's buzz on one question; never empty
 * @returns {Buzz}
 */
export function bestBuzz (buzzes) {
  return buzzes.reduce((best, buzz) => {
    if (buzz.points !== best.points) {
      return buzz.points > best.points ? buzz : best;
    }
    return earliestBuzz([buzz, best]);
  });
}

/**
 * Reduces a team's buzzes to one scoring buzz per question.
 * @param {Buzz[]} buzzes - a team's buzzes, across any number of questions
 * @param {function(Buzz[]): Buzz} [strategy] - how to pick when teammates both buzzed
 * @returns {Buzz[]} one correct buzz per question, ordered by question number
 */
export default function mergeBuzzes (buzzes, strategy = earliestBuzz) {
  const byQuestion = new Map();
  const correctBuzzes = buzzes.filter(buzz => buzz.points > 0);

  for (const buzz of correctBuzzes) {
    const question = byQuestion.get(buzz.questionNumber) ?? [];
    question.push(buzz);
    byQuestion.set(buzz.questionNumber, question);
  }

  return [...byQuestion.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, question]) => strategy(question));
}
