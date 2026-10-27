import { users } from '../../account-info/collections.js';
import { payments } from '../collections.js';

/**
 * @param {string} packetName
 * @returns {Promise<{ username: string, email: string }[]>} the users with a payment recorded for the packet, sorted by username.
 */
export default async function getRegisteredUsers (packetName) {
  const userIds = await payments.distinct('user_id', { 'packet.name': packetName });
  const result = await users.find(
    { _id: { $in: userIds } },
    { projection: { _id: 0, username: 1, email: 1 } }
  ).toArray();

  result.sort((a, b) => a.username.localeCompare(b.username));
  return result;
}
