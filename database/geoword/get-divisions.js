import { packets } from './collections.js';

/**
 *
 * @param {String} packetName
 * @returns {Promise<Array<String>>} divisions
 */
async function getDivisions (packetName) {
  const packet = await packets.findOne({ name: packetName });
  return packet?.divisions;
}

export default getDivisions;
