/**
 * Orders the standings best first: win percentage, then points, then correct answers, then
 * average celerity. Teams yet to play a match (null win percentage) go last.
 * @param {{ winPercentage: number | null, points: number, numberCorrect: number, averageCorrectCelerity: number }} a
 * @param {{ winPercentage: number | null, points: number, numberCorrect: number, averageCorrectCelerity: number }} b
 * @returns {number} negative if `a` ranks above `b`
 */
export default function compareStandings (a, b) {
  return (b.winPercentage ?? -1) - (a.winPercentage ?? -1) ||
    b.points - a.points ||
    b.numberCorrect - a.numberCorrect ||
    b.averageCorrectCelerity - a.averageCorrectCelerity;
}
