import { audio, tossups } from './collections.js';

/**
 *
 * @param {String} packetName
 * @param {String} division
 * @param {Integer} questionNumber
 * @returns {Promise<Buffer>}
 */
async function getAudio(packetName, division, questionNumber) {
    const tossup = await tossups.findOne({ 'packet.name': packetName, division, questionNumber });
    if (!tossup) {
        return null;
    }

    const audioFile = await audio.findOne({ _id: tossup.audio_id });
    if (!audioFile) {
        return null;
    }

    return audioFile.audio.buffer;
}

export default getAudio;
