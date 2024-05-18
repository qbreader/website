import { buzzes } from './collections.js';

/**
 *
 * @param {String} packetName
 * @param {String} division
 * @param {ObjectId} user_id
 * @param {Boolean} protests - whether to include protests (default: false)
 */
async function getBuzzes (packetName, division, user_id, protests = false) {
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
    { $match: { 'packet.name': packetName, division, user_id } },
    { $sort: { questionNumber: 1 } },
    {
      $lookup: {
        from: 'tossups',
        let: { questionNumber: '$questionNumber', packet: { name: packetName }, division },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$questionNumber', '$$questionNumber'] },
                  { $eq: ['$packet.name', '$$packet.name'] },
                  { $eq: ['$division', '$$division'] }
                ]
              }
            }
          }
        ],
        as: 'tossup'
      }
    },
    { $unwind: '$tossup' },
    { $project: projection }
  ]).toArray();
}

export default getBuzzes;
