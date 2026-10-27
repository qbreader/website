import { users } from '../../account-info/collections.js';
import { divisionChoices } from '../collections.js';

/**
 * @param {string} packetName
 * @returns {Promise<{ username: string, email: string, registeredAt: Date }[]>} the users who chose a division for the packet, sorted by username.
 * The registration time is when the user first chose a division, taken from the creation time of the choice's ObjectId.
 */
export default async function getRegisteredUsers (packetName) {
  const choices = await divisionChoices.find({ 'packet.name': packetName }).toArray();
  const registeredAt = new Map(choices.map(choice => [choice.user_id.toString(), choice._id.getTimestamp()]));

  const result = await users.find(
    { _id: { $in: choices.map(choice => choice.user_id) } },
    { projection: { username: 1, email: 1 }, sort: { username: 1 }, collation: { locale: 'en' } }
  ).toArray();

  return result.map(({ _id, username, email }) => ({ username, email, registeredAt: registeredAt.get(_id.toString()) }));
}
