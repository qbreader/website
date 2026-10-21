import { packets } from './collections.js';

/**
 * @param {String} packetName
 * @param {Boolean} published
 * @returns {Promise<Boolean>} whether the packet exists
 */
async function setPacketPublished (packetName, published) {
  const { matchedCount } = await packets.updateOne({ name: packetName }, { $set: { test: !published } });
  return matchedCount > 0;
}

export default setPacketPublished;
