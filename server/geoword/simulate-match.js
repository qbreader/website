import { bestBuzz, earliestBuzz } from './merge-buzzes.js';

/**
 * Plays a simulated match between two teams that heard the same packet separately.
 *
 * Each team's lead buzz on a question is its earliest (see merge-buzzes.js). Higher
 * celerity means a buzz was earlier.
 *
 * If the team that buzzed first doesn't score, the other team is credited with its best
 * teammate's buzz rather than its earliest.
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
  const points = [first.points, first.points > 0 ? 0 : Math.max(0, second.points)];
  return aFirst ? points : [points[1], points[0]];
}

/**
 * @param {Buzz[]} [aBuzzes] - every buzz by the first team on the question, if it heard it
 * @param {Buzz[]} [bBuzzes] - every buzz by the second team on the question, if it heard it
 * @returns {[Buzz | undefined, Buzz | undefined]} the buzz that decides each team's result
 */
function pickBuzzes (aBuzzes, bBuzzes) {
  const a = aBuzzes && earliestBuzz(aBuzzes);
  const b = bBuzzes && earliestBuzz(bBuzzes);
  if (!a || !b || a.celerity === b.celerity) { return [a, b]; }

  const aFirst = a.celerity > b.celerity;
  if ((aFirst ? a : b).points > 0) { return [a, b]; }
  return aFirst ? [a, bestBuzz(bBuzzes)] : [bestBuzz(aBuzzes), b];
}

/**
 * @param {Map<number, Buzz[]>} a - the first team's buzzes by question number, from `groupBuzzesByQuestion`
 * @param {Map<number, Buzz[]>} b - the second team's buzzes by question number, from `groupBuzzesByQuestion`
 * @returns {{ points: [number, number], winner: 0 | 1 | null, playerPoints: [Object<string, number>, Object<string, number>], questions: Array<{ questionNumber: number, buzzes: [Buzz | undefined, Buzz | undefined], points: [number, number] }> }}
 * each team's total, the index of the team with the higher total (null on a tie), each
 * team's points by the player whose buzz scored them, and, in question order, the buzz that
 * decided each team's result on a question and what it scored
 */
export default function simulateMatch (a, b) {
  const playerPoints = [{}, {}];
  const questions = [];
  for (const questionNumber of [...new Set([...a.keys(), ...b.keys()])].sort((x, y) => x - y)) {
    const buzzes = pickBuzzes(a.get(questionNumber), b.get(questionNumber));
    const scored = scoreQuestion(...buzzes);
    questions.push({ questionNumber, buzzes, points: scored });
    scored.forEach((questionPoints, side) => {
      if (!buzzes[side]) { return; }
      const player = String(buzzes[side].user_id);
      playerPoints[side][player] = (playerPoints[side][player] ?? 0) + questionPoints;
    });
  }

  const points = playerPoints.map(team => Object.values(team).reduce((sum, p) => sum + p, 0));

  return { points, winner: points[0] === points[1] ? null : points[0] > points[1] ? 0 : 1, playerPoints, questions };
}
