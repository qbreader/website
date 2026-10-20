import { buzzes } from '../../collections.js';

/**
 * @param {Object} options
 * @param {String} options.packetName
 * @param {String} options.division
 * @param {Object} options.team
 * @returns {Promise<Array<{ questionNumber: number, answer_sanitized: string, buzzes: Array<{ user_id: ObjectId, givenAnswer: string, points: number, celerity: number }> }>>}
 */
async function getTeamBuzzes ({ packetName, division, team }) {
  return await buzzes.aggregate([
    { $match: { 'packet.name': packetName, division, user_id: { $in: team.members } } },
    { $sort: { questionNumber: 1, user_id: 1 } },
    {
      $lookup: {
        from: 'tossups',
        localField: 'tossup_id',
        foreignField: '_id',
        as: 'tossup'
      }
    },
    { $unwind: '$tossup' },
    {
      $group: {
        _id: '$questionNumber',
        answer_sanitized: { $first: '$tossup.answer_sanitized' },
        buzzes: { $push: { user_id: '$user_id', givenAnswer: '$givenAnswer', points: '$points', celerity: '$celerity' } }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, questionNumber: '$_id', answer_sanitized: 1, buzzes: 1 } }
  ]).toArray();
}

export default getTeamBuzzes;
