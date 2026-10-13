import { tossups } from '../../collections.js';

/**
 * @param {String} packetName
 * @param {String} division
 * @param {Number} questionNumber
 * @returns {Promise<String>} the tossup's instructions, or an empty string if it has none
 */
async function getInstructions (packetName, division, questionNumber) {
  const result = await tossups.findOne({ 'packet.name': packetName, division, questionNumber }, { projection: { instructions: 1 } });
  return result?.instructions ?? '';
}

export default getInstructions;
