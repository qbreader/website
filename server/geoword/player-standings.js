/**
 * Orders players best first: points per game > points > correct answers > average celerity.
 * Players without a points per game (not on a team that has played a match) go last.
 * @param {{ pointsPerGame: number | null, points: number, numberCorrect: number, averageCorrectCelerity: number | null }} a
 * @param {{ pointsPerGame: number | null, points: number, numberCorrect: number, averageCorrectCelerity: number | null }} b
 * @returns {number} negative if `a` ranks above `b`
 */
export function comparePlayers (a, b) {
  return (b.pointsPerGame ?? -1) - (a.pointsPerGame ?? -1) ||
    b.points - a.points ||
    b.numberCorrect - a.numberCorrect ||
    (b.averageCorrectCelerity ?? -1) - (a.averageCorrectCelerity ?? -1);
}
