import { users } from '../../account-info/collections.js';
import { buzzes, divisionChoices } from '../collections.js';

/**
 * @param {string} packetName
 * @returns {Promise<{ username: string, email: string }[]>} the users who chose a division or played at least one tossup of the packet, sorted by username.
 */
export default async function getRegisteredUsers (packetName) {
  const filter = { 'packet.name': packetName };
  const [choosers, players] = await Promise.all([
    divisionChoices.distinct('user_id', filter),
    buzzes.distinct('user_id', filter)
  ]);

  const result = await users.find(
    { _id: { $in: [...choosers, ...players] } },
    { projection: { _id: 0, username: 1, email: 1 } }
  ).toArray();

  result.sort((a, b) => a.username.localeCompare(b.username));
  return result;
}
