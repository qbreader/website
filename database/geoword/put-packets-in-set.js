import { buzzes, divisionChoices, packets, payments, sets, teams, tossups } from './collections.js';

/**
 * Puts existing packets in a set, for data created before sets existed.
 * Writes `set: { _id, name }` onto each packet and every tossup, buzz, payment and division choice of
 * those packets. Teams used to belong to a packet (`packetName`); they now belong to a set, so the
 * packets' teams move to the set too and lose `packetName`. Special users listed on the packets are
 * added to the set's `specialUsers` (the packets keep theirs). Idempotent.
 * @param {Object} options
 * @param {{ _id: ObjectId, name: string }} options.set
 * @param {String[]} options.packetNames
 * @param {Boolean} [options.dryRun] - count what would change without writing
 * @returns {Promise<Object<string, number>>} how many documents of each kind were (or would be) updated
 * @throws if a packet is missing or in another set, or two teams would share a name in a division of the set
 */
async function putPacketsInSet ({ set, packetNames, dryRun = false }) {
  for (const name of packetNames) {
    const packet = await packets.findOne({ name });
    if (!packet) {
      throw new Error(`Packet "${name}" does not exist.`);
    }
    if (packet.set && String(packet.set._id) !== String(set._id)) {
      throw new Error(`Packet "${name}" is already in set "${packet.set.name}".`);
    }
  }

  const oldTeams = await teams.find({ packetName: { $in: packetNames } }).toArray();
  const seen = new Map();
  for (const team of [...await teams.find({ 'set._id': set._id }).toArray(), ...oldTeams]) {
    const key = `${team.division}\u0000${team.teamName.toLowerCase()}`;
    if (seen.has(key) && String(seen.get(key)) !== String(team._id)) {
      throw new Error(`Two teams named "${team.teamName}" in division "${team.division}" would share set "${set.name}". Resolve them by hand first.`);
    }
    seen.set(key, team._id);
  }

  const filter = { 'packet.name': { $in: packetNames } };
  const counts = { packets: packetNames.length, teams: oldTeams.length };

  for (const [label, collection] of Object.entries({ tossups, buzzes, payments, 'division choices': divisionChoices })) {
    counts[label] = await collection.countDocuments(filter);
    if (!dryRun) {
      await collection.updateMany(filter, { $set: { set } });
    }
  }

  const specialUsers = (await packets.find({ name: { $in: packetNames } }, { projection: { specialUsers: 1 } }).toArray()).flatMap(packet => packet.specialUsers ?? []);
  counts['special users'] = specialUsers.length;

  if (!dryRun) {
    if (specialUsers.length > 0) {
      await sets.updateOne({ _id: set._id }, { $addToSet: { specialUsers: { $each: specialUsers } } });
    }
    await packets.updateMany({ name: { $in: packetNames } }, { $set: { set } });
    await teams.updateMany({ packetName: { $in: packetNames } }, { $set: { set }, $unset: { packetName: '' } });
  }

  return counts;
}

export default putPacketsInSet;
