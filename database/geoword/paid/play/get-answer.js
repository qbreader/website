import { tossups } from '../../collections.js';

/**
 *
 * @param {String} packetName
 * @param {Number} questionNumber
 * @returns
 */
async function getAnswer (packetName, division, questionNumber) {
  const result = await tossups.findOne({ 'packet.name': packetName, division, questionNumber });

  if (!result) {
    return '';
  } else {
    return result.answer;
  }
}

export default getAnswer;
