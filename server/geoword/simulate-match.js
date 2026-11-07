/**
 * Plays a simulated match between two teams that heard the same packet separately.
 *
 * Each team brings one buzz per question, its merged buzz from merge-buzzes.js. Celerity
 * stands in for time: the team with the higher celerity buzzed first. Celerity is clamped
 * to [0, 1], so two teams that both answered after the audio ended tie at 0 and buzzed at
 * the same time.
 */

/**
 * @typedef {import('./merge-buzzes.js').Buzz} Buzz
 */

/**
 * @param {Buzz} [a] - the first team's buzz, if it heard the question
 * @param {Buzz} [b] - the second team's buzz, if it heard the question
 * @returns {[number, number]} the points each team scores on the question
 */
function scoreQuestion (a, b) {
  if (!a || !b) { return [a?.points ?? 0, b?.points ?? 0]; }

  if (a.celerity === b.celerity) {
    return a.points > 0 && b.points > 0 ? [a.points / 2, b.points / 2] : [a.points, b.points];
  }

  const aFirst = a.celerity > b.celerity;
  const [first, second] = aFirst ? [a, b] : [b, a];
  const points = [first.points, first.points > 0 ? 0 : second.points];
  return aFirst ? points : [points[1], points[0]];
}

/**
 * @param {Buzz[]} a - the first team's merged buzzes, one per question
 * @param {Buzz[]} b - the second team's merged buzzes, one per question
 * @returns {{ points: [number, number], winner: 0 | 1 | null, playerPoints: [Object<string, number>, Object<string, number>] }}
 * each team's total, the index of the team with the higher total (null on a tie), and each
 * team's points by the player whose buzz scored them
 */
export default function simulateMatch (a, b) {
  const aByQuestion = new Map(a.map(buzz => [buzz.questionNumber, buzz]));
  const bByQuestion = new Map(b.map(buzz => [buzz.questionNumber, buzz]));

  const playerPoints = [{}, {}];
  for (const questionNumber of new Set([...aByQuestion.keys(), ...bByQuestion.keys()])) {
    const buzzes = [aByQuestion.get(questionNumber), bByQuestion.get(questionNumber)];
    scoreQuestion(...buzzes).forEach((questionPoints, side) => {
      if (!buzzes[side]) { return; }
      const player = String(buzzes[side].user_id);
      playerPoints[side][player] = (playerPoints[side][player] ?? 0) + questionPoints;
    });
  }

  const points = playerPoints.map(team => Object.values(team).reduce((sum, p) => sum + p, 0));

  return { points, winner: points[0] === points[1] ? null : points[0] > points[1] ? 0 : 1, playerPoints };
}
