import { ObjectId } from 'mongodb';

import { users } from '../../account-info/collections.js';
import { divisionChoices, teams } from '../collections.js';
import getPacketSet from '../get-packet-set.js';

/**
 * @param {string} packetName
 * @returns {Promise<{ username: string, email: string, registeredAt: Date | null, teamName: string | null }[]>} the users who chose a division for the packet
 * or are on a team for the packet's set.
 * Users on a team come first, then everyone else; each group is sorted by username.
 * The registration time is when the user first chose a division, taken from the creation time of the choice's ObjectId.
 * It is null for team members who have not chosen a division.
 */
export default async function getRegisteredUsers (packetName) {
  const choices = await divisionChoices.find({ 'packet.name': packetName }).toArray();
  const registeredAt = new Map(choices.map(choice => [choice.user_id.toString(), choice._id.getTimestamp()]));

  const set = await getPacketSet(packetName);
  const teamList = set ? await teams.find({ 'set._id': set._id }, { projection: { teamName: 1, members: 1 } }).toArray() : [];
  const userIdToTeamName = new Map(teamList.flatMap(({ teamName, members }) => members.map(member => [member.toString(), teamName])));

  const userIds = [...new Set([...registeredAt.keys(), ...userIdToTeamName.keys()])].map(id => new ObjectId(id));

  const result = await users.find(
    { _id: { $in: userIds } },
    { projection: { username: 1, email: 1 }, sort: { username: 1 }, collation: { locale: 'en' } }
  ).toArray();

  const registered = result.map(({ _id, username, email }) => ({
    username,
    email,
    registeredAt: registeredAt.get(_id.toString()) ?? null,
    teamName: userIdToTeamName.get(_id.toString()) ?? null
  }));

  // Array.prototype.sort is stable, so each group stays sorted by username
  return registered.sort((a, b) => (a.teamName === null) - (b.teamName === null));
}
