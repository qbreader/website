import { buzzes, packets } from '../../collections.js';
import getDivisionChoice from '../../get-division-choice.js';

import isAdminById from '../../../account-info/is-admin-by-id.js';

/**
 * @param {Object} params
 * @param {Decimal} params.celerity
 * @param {String} params.givenAnswer
 * @param {Boolean} params.isCorrect
 * @param {String} params.packetName
 * @param {Number} params.questionNumber
 * @param {ObjectId} params.user_id
 * @param {String[]} params.prompts - whether or not the buzz is a prompt
 */
async function recordBuzz ({ celerity, givenAnswer, packetName, points, prompts, questionNumber, user_id: userId }) {
  const [division, packet, admin] = await Promise.all([
    getDivisionChoice(packetName, userId),
    packets.findOne({ name: packetName }),
    isAdminById(userId)
  ]);

  const insertDocument = {
    active: packet.active && !admin,
    celerity,
    division,
    givenAnswer,
    points,
    packet: {
      _id: packet._id,
      name: packet.name
    },
    questionNumber,
    user_id: userId
  };

  if (prompts && typeof prompts === 'object' && prompts.length > 0) {
    insertDocument.prompts = prompts;
  }

  return await buzzes.insertOne(insertDocument);
}

export default recordBuzz;
