import { packets, sets } from './collections.js';

/**
 * @param {{ costInCents?: number } | null} packet
 * @param {{ payment?: { perSet?: boolean, costInCents?: number } } | null} set - the packet's set
 * @returns {Integer} the cost to play the packet, in cents (USD). A packet with no cost of its own is free,
 * and a set-wide payment replaces the packet's cost unless it has no amount.
 */
export function getPacketCost (packet, set) {
  if (!packet?.costInCents) { return 0; }

  const setCostInCents = set?.payment?.perSet ? set.payment.costInCents : undefined;
  return setCostInCents ?? packet.costInCents;
}

/**
 * @param {String} packetName
 * @returns {Integer} the cost to play the packet, in cents (USD)
 */
async function getCost (packetName) {
  const packet = await packets.findOne({ name: packetName });
  const set = packet?.costInCents && packet.set
    ? await sets.findOne({ _id: packet.set._id }, { projection: { payment: 1 } })
    : null;
  return getPacketCost(packet, set);
}

export default getCost;
