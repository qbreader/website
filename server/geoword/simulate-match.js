import { earliestBuzz } from './merge-buzzes.js';

/**
 * Plays a simulated match between two teams that heard the same packet separately.
 *
 * Each team's lead buzz on a question is its earliest (see merge-buzzes.js). Celerity
 * stands in for time: the team whose lead buzz has the higher celerity buzzed first.
 * Celerity is clamped to [0, 1], so two teams that both answered after the audio ended
 * tie at 0 and buzzed at the same time.

 */

/**
 * @typedef {import('./merge-buzzes.js').Buzz} Buzz
 */

/**
 * @param {Buzz[]} [aBuzzes] - every buzz by the first team on the question, if it heard it
 * @param {Buzz[]} [bBuzzes] - every buzz by the second team on the question, if it heard it
 * @returns {[Buzz | undefined, number][]} for each team, the buzz that decided its result
 * and the points it scores on the question
 */
function scoreQuestion (aBuzzes, bBuzzes) {
  const a = aBuzzes && earliestBuzz(aBuzzes);
  const b = bBuzzes && earliestBuzz(bBuzzes);
  if (!a || !b) { return [[a, a?.points ?? 0], [b, b?.points ?? 0]]; }

  if (a.celerity === b.celerity) {
    return a.points > 0 && b.points > 0
      ? [[a, a.points / 2], [b, b.points / 2]]
      : [[a, a.points], [b, b.points]];
  }

  const aFirst = a.celerity > b.celerity;
  const first = aFirst ? a : b;
  if (first.points > 0) {
    return aFirst ? [[a, a.points], [b, 0]] : [[a, 0], [b, b.points]];
  }

  const second = aFirst ? b : a;
  const results = [[first, first.points], [second, Math.max(0, second.points)]];
  return aFirst ? results : [results[1], results[0]];
}

/**
 * @param {Map<number, Buzz[]>} a - the first team's buzzes by question number, from `groupBuzzesByQuestion`
 * @param {Map<number, Buzz[]>} b - the second team's buzzes by question number, from `groupBuzzesByQuestion`
 * @returns {{ points: [number, number], winner: 0 | 1 | null, playerPoints: [Object<string, number>, Object<string, number>] }}
 * each team's total, the index of the team with the higher total (null on a tie), and each
 * team's points by the player whose buzz scored them
 */
export default function simulateMatch (a, b) {
  const playerPoints = [{}, {}];
  for (const questionNumber of new Set([...a.keys(), ...b.keys()])) {
    scoreQuestion(a.get(questionNumber), b.get(questionNumber)).forEach(([buzz, questionPoints], side) => {
      if (!buzz) { return; }
      const player = String(buzz.user_id);
      playerPoints[side][player] = (playerPoints[side][player] ?? 0) + questionPoints;
    });
  }

  const points = playerPoints.map(team => Object.values(team).reduce((sum, p) => sum + p, 0));

  return { points, winner: points[0] === points[1] ? null : points[0] > points[1] ? 0 : 1, playerPoints };
}
