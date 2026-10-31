import { buzzes, packets, teams } from '../../collections.js';
import getQuestionCount from '../../get-question-count.js';

/**
 * @typedef {Object} DivisionTeam
 * @property {Object} team - a document from the `teams` collection
 * @property {Object[]} buzzes - every member's buzzes in the division
 * @property {Object[]} finishedBuzzes - the buzzes of the members who have heard every
 * question in the division. Their results no longer change, so simulated matches use
 * only these.
 */

/**
 * The teams that played each division of a packet, with their members' buzzes.
 * Shared by the team standings and the match endpoint so that the two always agree.
 *
 * @param {Object} options
 * @param {String} options.packetName
 * @param {Boolean} [options.includeInactive] - count buzzes excluded from rankings
 * @returns {Promise<Object<string, DivisionTeam[]>>} division name -> the teams with at
 * least one buzz in it
 */
export default async function getDivisionTeams ({ packetName, includeInactive = false }) {
  const packet = await packets.findOne({ name: packetName });
  const divisions = packet?.divisions;
  if (!divisions || divisions.length === 0) {
    return {};
  }

  const teamList = await teams.find({ 'set._id': packet.set._id }).toArray();
  const members = teamList.flatMap(team => team.members);

  const divisionTeams = await Promise.all(divisions.map(async division => {
    if (teamList.length === 0) { return []; }

    // One query per division rather than one per team. Inactive buzzes still count
    // towards finishing the packet, so they are filtered out afterwards.
    const [buzzList, questionCount] = await Promise.all([
      buzzes.find({ 'packet.name': packetName, division, user_id: { $in: members } }).toArray(),
      getQuestionCount(packetName, division)
    ]);

    const buzzesByUser = new Map();
    for (const buzz of buzzList) {
      const userBuzzes = buzzesByUser.get(String(buzz.user_id)) ?? [];
      userBuzzes.push(buzz);
      buzzesByUser.set(String(buzz.user_id), userBuzzes);
    }

    return teamList
      .map(team => {
        const memberBuzzes = team.members.map(member => buzzesByUser.get(String(member)) ?? []);
        const counted = userBuzzes => includeInactive ? userBuzzes : userBuzzes.filter(buzz => buzz.active);
        return {
          team,
          buzzes: memberBuzzes.flatMap(counted),
          finishedBuzzes: memberBuzzes.filter(userBuzzes => userBuzzes.length >= questionCount).flatMap(counted)
        };
      })
      .filter(({ buzzes }) => buzzes.length > 0);
  }));

  return Object.fromEntries(divisions.map((division, index) => [division, divisionTeams[index]]));
}
