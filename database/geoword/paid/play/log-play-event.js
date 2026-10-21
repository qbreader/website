import { packets, playLogs } from '../../collections.js';

/**
 * @param {object} event
 * @param {'audio' | 'check-answer'} event.type
 * @param {string} event.packetName
 * @param {number} event.questionNumber
 * @param {ObjectId} event.userId
 * @param {string} [event.givenAnswer]
 * @param {'accept' | 'prompt' | 'reject'} [event.directive]
 */
export default async function logPlayEvent ({ type, packetName, questionNumber, userId, givenAnswer, directive }) {
  const packet = await packets.findOne({ name: packetName }, { projection: { _id: 1 } });

  return await playLogs.insertOne({
    type,
    user_id: userId,
    packet: { _id: packet?._id },
    questionNumber,
    ...(type === 'check-answer' && { givenAnswer, directive })
  });
}
