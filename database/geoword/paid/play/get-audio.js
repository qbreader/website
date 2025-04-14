import { audio, tossups } from '../../collections.js';

/**
 * @param {object} options
 * @param {string} options.division
 * @param {string} options.packetName
 * @param {integer} options.questionNumber
 * @returns {Promise<Buffer>}
 */
export default async function getAudio ({ packetName, division, questionNumber }) {
  const tossup = await tossups.findOne({ 'packet.name': packetName, division, questionNumber });
  if (!tossup) { return null; }

  const audioFile = await audio.findOne({ _id: tossup.audio_id });
  if (!audioFile) { return null; }

  return audioFile.audio.buffer;
}
