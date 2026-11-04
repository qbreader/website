import mergeBuzzes from './merge-buzzes.js';

/**
 * Standings for one team, after its members' buzzes are merged question by question.
 * @param {Object} team - a document from the `teams` collection
 * @param {Object[]} teamBuzzes - every buzz by every member of that team
 * @returns {Object} the team's row in the standings
 */
export function scoreTeam (team, teamBuzzes) {
  const merged = mergeBuzzes(teamBuzzes);
  const correct = merged.filter(buzz => buzz.points > 0);
  const points = merged.reduce((total, buzz) => total + buzz.points, 0);

  return {
    teamName: team.teamName,
    memberCount: team.members.length,
    numberCorrect: correct.length,
    points,
    // One row per question at least one member heard. Members play asynchronously and
    // may be at different points in the packet, so this is not the packet length until
    // everyone has finished - team PPTU is unstable before then.
    tossupsHeard: merged.length,
    pointsPerTossup: merged.length === 0 ? 0 : points / merged.length,
    averageCorrectCelerity: correct.length === 0
      ? 0
      : correct.reduce((total, buzz) => total + buzz.celerity, 0) / correct.length
  };
}

/**
 * Orders the standings best first: win percentage, then points, then correct answers, then
 * average celerity. Teams yet to play a match (null win percentage) go last.
 * @param {{ winPercentage: number | null, points: number, numberCorrect: number, averageCorrectCelerity: number }} a
 * @param {{ winPercentage: number | null, points: number, numberCorrect: number, averageCorrectCelerity: number }} b
 * @returns {number} negative if `a` ranks above `b`
 */
export function compareStandings (a, b) {
  return (b.winPercentage ?? -1) - (a.winPercentage ?? -1) ||
    b.points - a.points ||
    b.numberCorrect - a.numberCorrect ||
    b.averageCorrectCelerity - a.averageCorrectCelerity;
}
