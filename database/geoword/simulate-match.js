/**
 * Plays a simulated match between two teams that heard the same packet separately.
 *
 * Each team brings one buzz per question, its merged buzz from merge-buzzes.js. Celerity
 * stands in for time: the team with the higher celerity buzzed first. Celerity is clamped
 * to [0, 1], so two teams that both answered after the audio ended tie at 0 and buzzed at
 * the same time.
 *
 * This is the only place match results are computed: the team standings and the match
 * endpoint both call it, so they always agree.
 */

/**
 * @typedef {import('./merge-buzzes.js').Buzz} Buzz
 */

/**
 * @typedef {Object} MatchResult
 * @property {Array<{ questionNumber: number, points: [number, number] }>} questions - in order
 * @property {[number, number]} points - each team's total
 * @property {0 | 1 | null} winner - the index of the team with the higher total, or null on a tie
 */

/**
 * @param {Buzz} [a] - the first team's buzz, if it heard the question
 * @param {Buzz} [b] - the second team's buzz, if it heard the question
 * @returns {[number, number]} the points each team scores on the question
 */
export function scoreQuestion (a, b) {
  if (!a || !b) { return [a?.points ?? 0, b?.points ?? 0]; }

  if (a.celerity === b.celerity) {
    // Buzzed at the same time: two correct answers split the points, otherwise each team
    // keeps its own buzz's points (a wrong answer after the audio is worth 0).
    return a.points > 0 && b.points > 0 ? [a.points / 2, b.points / 2] : [a.points, b.points];
  }

  const aFirst = a.celerity > b.celerity;
  const [first, second] = aFirst ? [a, b] : [b, a];
  // A correct first buzz locks the other team out. A wrong one takes its points and
  // leaves the question to the other team.
  const points = first.points > 0 ? [first.points, 0] : [first.points, second.points];
  return aFirst ? points : [points[1], points[0]];
}

/**
 * @param {Buzz[]} a - the first team's merged buzzes, one per question
 * @param {Buzz[]} b - the second team's merged buzzes, one per question
 * @returns {MatchResult}
 */
export default function simulateMatch (a, b) {
  const aByQuestion = new Map(a.map(buzz => [buzz.questionNumber, buzz]));
  const bByQuestion = new Map(b.map(buzz => [buzz.questionNumber, buzz]));
  const questionNumbers = [...new Set([...aByQuestion.keys(), ...bByQuestion.keys()])].sort((x, y) => x - y);

  const questions = questionNumbers.map(questionNumber => ({
    questionNumber,
    points: scoreQuestion(aByQuestion.get(questionNumber), bByQuestion.get(questionNumber))
  }));
  const points = questions.reduce(([x, y], question) => [x + question.points[0], y + question.points[1]], [0, 0]);

  return { questions, points, winner: points[0] === points[1] ? null : points[0] > points[1] ? 0 : 1 };
}
