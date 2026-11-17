import { buzzes } from '../collections.js';

import getUsername from '../../account-info/get-username.js';

/**
 * @param {object} params
 * @param {String} params.packetName
 * @param {String} params.division
 * @param {Number} params.questionNumber
 * @returns {Promise<Array<buzzes>>} every buzz on the question, with a `username`, ordered by celerity
 */
async function getQuestionBuzzes ({ packetName, division, questionNumber }) {
  const questionBuzzes = await buzzes.find(
    { 'packet.name': packetName, division, questionNumber },
    { sort: { celerity: -1 } }
  ).toArray();

  await Promise.all(questionBuzzes.map(async buzz => {
    buzz.username = await getUsername(buzz.user_id);
    if (buzz.override) { buzz.override.decidedByUsername = await getUsername(buzz.override.decidedBy); }
  }));

  return questionBuzzes;
}

export default getQuestionBuzzes;
