import { bonuses, packets, tossups } from '../collections.js';

/**
 * Renames a packet within a set and updates all associated tossups and bonuses with the new packet name.
 *
 * @param {string} setName - The name of the set containing the packet.
 * @param {number} packetNumber - The number identifying the packet to rename.
 * @param {string} newPacketName - The new name to assign to the packet.
 * @returns {Promise<boolean>} Returns true if the packet was found and renamed, false otherwise.
 */
export default async function renamePacket (setName, packetNumber, newPacketName) {
  const packet = await packets.findOneAndUpdate(
    { 'set.name': setName, number: packetNumber },
    { $set: { name: newPacketName } }
  );

  if (!packet) { return false; }

  await tossups.updateMany(
    { 'packet._id': packet._id },
    { $set: { 'packet.name': newPacketName, updatedAt: new Date() } }
  );

  await bonuses.updateMany(
    { 'packet._id': packet._id },
    { $set: { 'packet.name': newPacketName, updatedAt: new Date() } }
  );

  return true;
}
