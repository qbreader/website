import { packets } from './collections.js';

/**
 * Retrieves the list of packets for a given set name, sorted by packet number.
 *
 * @param {string} setName - The name of the set to retrieve packets from.
 * @returns {Promise<{number: number, name: string}[]>} A promise that resolves to an array of packet objects, each containing a number and name.
 */
export default async function getPacketList (setName) {
  if (!setName) { return []; }

  const packetList = await packets.find({ 'set.name': setName }, {
    sort: { number: 1 },
    project: { _id: 0, number: 1, name: 1 }
  }).toArray();

  return packetList;
}
