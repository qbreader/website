import { buzzes } from './collections.js';

/**
 *
 * @param {String} packetName
 * @param {String} division
 * @param {ObjectId} userId
 * @param {Boolean} protests - whether to include protests (default: false)
 */
async function getBuzzes (packetName, division, userId, protests = false) {
  const projection = {
    _id: 0,
    celerity: 1,
    points: 1,
    questionNumber: 1,
    answer_sanitized: '$tossup.answer_sanitized',
    answer: '$tossup.answer',
    givenAnswer: 1,
    prompts: 1
  };

  if (protests) {
    projection.pendingProtest = 1;
    projection.decision = 1;
    projection.reason = 1;
  }

  return await buzzes.aggregate([
    { $match: { 'packet.name': packetName, division, user_id: userId } },
    { $sort: { questionNumber: 1 } },
    {
      $lookup: {
        from: 'tossups',
        localField: 'tossup_id',
        foreignField: '_id',
        as: 'tossup'
      }
    },
    { $unwind: '$tossup' },
    { $project: projection }
  ]).toArray();
}

export default getBuzzes;
