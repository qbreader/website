import mergeBuzzes from '../../merge-buzzes.js';
import simulateMatch from '../../simulate-match.js';
import getDivisionTeams from './get-division-teams.js';

/**
 * The simulated match between two teams on a packet, played exactly as the team
 * standings play it.
 *
 * @param {Object} options
 * @param {String} options.packetName
 * @param {String} options.division
 * @param {[String, String]} options.teamNames
 * @returns {Promise<{ teamNames: [string, string], finished: [boolean, boolean], result: import('../../simulate-match.js').MatchResult | null } | null>}
 * null if either team didn't play the division. `finished` says whether each team has a
 * member who finished the division, and `result` is null until both do.
 */
export default async function getMatch ({ packetName, division, teamNames }) {
  const teamList = (await getDivisionTeams({ packetName }))[division] ?? [];
  const pair = teamNames.map(teamName => teamList.find(({ team }) => team.teamName === teamName));
  if (pair.some(divisionTeam => divisionTeam === undefined)) { return null; }

  const merged = pair.map(({ finishedBuzzes }) => mergeBuzzes(finishedBuzzes));
  const finished = merged.map(buzzes => buzzes.length > 0);

  return {
    teamNames,
    finished,
    result: finished.every(Boolean) ? simulateMatch(merged[0], merged[1]) : null
  };
}
