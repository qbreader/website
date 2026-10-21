import { buzzes, packets, tossups } from '../../collections.js';

import scoreBuzz from '../../../../shared/geoword-scoring.js';
import hasPacketPrivileges from '../../has-packet-privileges.js';

/**
 * @param {Object} params
 * @param {Decimal} params.celerity
 * @param {String} params.division
 * @param {String} params.givenAnswer
 * @param {Boolean} params.isCorrect
 * @param {String} params.packetName
 * @param {Number} params.questionNumber
 * @param {ObjectId} params.user_id
 * @param {String[]} params.prompts - whether or not the buzz is a prompt
 */
async function recordBuzz ({ celerity, division, givenAnswer, isCorrect, packetName, prompts, questionNumber, userId }) {
  const [privileged, packet, tossup] = await Promise.all([
    hasPacketPrivileges(packetName, userId),
    packets.findOne({ name: packetName }),
    tossups.findOne({ 'packet.name': packetName, division, questionNumber })
  ]);

  const insertDocument = {
    active: packet.active && !privileged,
    celerity,
    division,
    givenAnswer,
    isCorrect,
    points: scoreBuzz(packet.scoring, { celerity, isCorrect }),
    packet: {
      _id: packet._id,
      name: packet.name
    },
    set: packet.set,
    questionNumber,
    tossup_id: tossup._id,
    user_id: userId
  };

  if (prompts && typeof prompts === 'object' && prompts.length > 0) {
    insertDocument.prompts = prompts;
  }

  return await buzzes.insertOne(insertDocument);
}

export default recordBuzz;
