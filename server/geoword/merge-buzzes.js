/**
 * Decides which of a team's buzzes counts on a single question.
 * The buzz selection strategy is a parameter, with the current options: `earliestBuzz` and `bestBuzz`.
 */

/**
 * @typedef {Object} Buzz
 * @property {number} celerity
 * @property {number} points
 * @property {number} questionNumber
 * @property {ObjectId} user_id
 */

/**
 * The earliest buzz counts, regardless of points. Teammates who buzzed at the same
 * moment count the correct one.
 * @param {Buzz[]} buzzes - every teammate's buzz on one question; never empty
 * @returns {Buzz}
 */
export function earliestBuzz (buzzes) {
  return buzzes.reduce((earliest, buzz) => {
    if (buzz.celerity !== earliest.celerity) {
      return buzz.celerity > earliest.celerity ? buzz : earliest;
    }
    // Same time: the team gives the correct answer if either teammate has it
    if ((buzz.points > 0) !== (earliest.points > 0)) {
      return buzz.points > 0 ? buzz : earliest;
    }
    // Otherwise break the tie by user so standings don't depend on database order
    return String(buzz.user_id) < String(earliest.user_id) ? buzz : earliest;
  });
}

/**
 * The team's best result on the question, ignoring who was first. Ties go to the
 * earliest buzz.
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
 * @param {Buzz[]} buzzes - a team's buzzes, across any number of questions
 * @returns {Map<number, Buzz[]>} question number -> every teammate's buzz on that question
 */
export function groupBuzzesByQuestion (buzzes) {
  const byQuestion = new Map();
  for (const buzz of buzzes) {
    const question = byQuestion.get(buzz.questionNumber) ?? [];
    question.push(buzz);
    byQuestion.set(buzz.questionNumber, question);
  }
  return byQuestion;
}

/**
 * Reduces a team's buzzes to one scoring buzz per question.
 * @param {Buzz[]} buzzes - a team's buzzes, across any number of questions
 * @param {function(Buzz[]): Buzz} [strategy] - how to pick when teammates both buzzed
 * @returns {Buzz[]} one buzz per question the team heard, ordered by question number
 */
export default function mergeBuzzes (buzzes, strategy = earliestBuzz) {
  return [...groupBuzzesByQuestion(buzzes).entries()]
    .sort(([a], [b]) => a - b)
    .map(([, question]) => strategy(question));
}
