import { buzzes, tossups } from './collections.js';

import getUsername from '../account-info/get-username.js';
import getDivisions from './get-divisions.js';

async function getDivisionProtests ({ division, packetName }) {
  const protests = await buzzes.find(
    { 'packet.name': packetName, division, pendingProtest: { $exists: true } },
    { sort: { questionNumber: 1 } }
  ).toArray();

  const packet = await tossups.find(
    { 'packet.name': packetName, division },
    { sort: { questionNumber: 1 } }
  ).toArray();

  for (const index in protests) {
    const userId = protests[index].user_id;
    protests[index].username = await getUsername(userId);
  }

  return { protests, packet };
}

/**
 *
 * @returns {Promise<{
 *   [division: string]: {
 *     protests: Array<buzzes>,
 *     packet: Array<tossups>
 * }>}
 */
async function getProtests ({ packetName }) {
  const divisions = await getDivisions(packetName);
  if (!divisions || divisions.length === 0) {
    return {};
  }

  const queries = divisions.map(division => getDivisionProtests({ division, packetName }));
  const results = await Promise.all(queries);

  return Object.fromEntries(
    divisions.map((division, index) => [division, results[index]])
  );
}

export default getProtests;
