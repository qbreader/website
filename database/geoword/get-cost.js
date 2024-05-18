import { packets } from './collections.js';

/**
 * @param {String} packetName
 * @returns {Integer} the cost to play the packet, in cents (USD)
 */
async function getCost (packetName) {
  const packet = await packets.findOne({ name: packetName });
  return packet?.costInCents ?? 0;
}

export default getCost;
