import { packets } from './collections.js';

/**
 * @param {String} packetName
 * @returns {Promise<{ _id: ObjectId, name: string } | null>}
 */
async function getPacketSet (packetName) {
  const packet = await packets.findOne({ name: packetName }, { projection: { set: 1 } });
  return packet?.set ?? null;
}

export default getPacketSet;
