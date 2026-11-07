import { packets } from './collections.js';

/**
 * Sets whether new buzzes on the packet count toward standings (see `recordBuzz`).
 * Buzzes that were already recorded keep the `active` value they were recorded with.
 * @param {String} packetName
 * @param {Boolean} active
 * @returns {Promise<Boolean>} whether the packet exists
 */
async function setPacketActive (packetName, active) {
  const { matchedCount } = await packets.updateOne({ name: packetName }, { $set: { active } });
  return matchedCount > 0;
}

export default setPacketActive;
