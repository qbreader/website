import { packets, sets } from './collections.js';

import getQuestionCount from './get-question-count.js';

/**
 * @param {String} packetName
 * @returns {Promise<{
 *   name: string,
 *   hidden: boolean,
 *   active: boolean,
 *   divisions: string[],
 *   questionCount: number,
 *   costInCents: number,
 *   set: { name: string, teamsEnabled: boolean } | null
 * } | null>} null if the packet doesn't exist
 */
async function getPacketInfo (packetName) {
  const packet = await packets.findOne({ name: packetName });
  if (!packet) { return null; }

  const [questionCount, set] = await Promise.all([
    getQuestionCount(packetName),
    packet.set ? sets.findOne({ _id: packet.set._id }, { projection: { name: 1, teams: 1 } }) : null
  ]);

  return {
    name: packet.name,
    hidden: packet.test === true,
    active: packet.active === true,
    divisions: packet.divisions ?? [],
    questionCount,
    costInCents: packet.costInCents ?? 0,
    set: set ? { name: set.name, teamsEnabled: set.teams?.enabled === true } : null
  };
}

export default getPacketInfo;
