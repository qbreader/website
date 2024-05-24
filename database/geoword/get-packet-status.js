import { packets } from './collections.js';

/**
 *
 * @param {*} packetName
 * @returns null if the packet doesn't exist, true if it is accessible to the public, and false if only admins can see it
 */
async function getPacketStatus (packetName) {
  const packet = await packets.findOne({ name: packetName });
  if (!packet) {
    return null;
  }

  return packet.test !== true;
}

export default getPacketStatus;
