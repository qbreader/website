import { buzzes } from '../../collections.js';
import getDivisionChoice from '../../get-division-choice.js';
import getBuzzes from '../../get-buzzes.js';

import getUsername from '../../../account-info/get-username.js';

/**
 * @param {String} packetName
 * @param {ObjectId} userId
 */
async function getUserStats (packetName, userId) {
  const division = await getDivisionChoice(packetName, userId);
  const buzzArray = await getBuzzes(packetName, division, userId, true);

  const leaderboard = await buzzes.aggregate([
    { $match: { 'packet.name': packetName, division, active: true } },
    { $addFields: { isCorrect: { $gt: ['$points', 0] } } },
    { $addFields: { correctCelerity: { $cond: ['$isCorrect', '$celerity', undefined] } } },
    { $sort: { correctCelerity: -1 } },
    {
      $group: {
        _id: '$questionNumber',
        bestCelerity: { $max: '$correctCelerity' },
        averageCorrectCelerity: { $avg: '$correctCelerity' },
        averagePoints: { $avg: '$points' },
        bestUserId: { $first: '$user_id' }
      }
    },
    { $sort: { _id: 1 } }
  ]).toArray();

  for (const index in buzzArray) {
    const question = leaderboard[index];

    if (question) {
      question.bestUsername = await getUsername(question.bestUserId);
      question.rank = 1 + await buzzes.countDocuments({
        'packet.name': packetName,
        questionNumber: question._id,
        division,
        active: true,
        $or: [
          {
            $and: [
              { celerity: { $gt: buzzArray[index].celerity } },
              { points: { $eq: buzzArray[index].points } }
            ]
          },
          { points: { $gt: buzzArray[index].points } }
        ]
      });
    } else {
      leaderboard[index] = {
        _id: index,
        bestCelerity: 0,
        bestUsername: '',
        averageCorrectCelerity: 0,
        averagePoints: 0,
        rank: 1
      };
    }
  }

  return { buzzArray, division, leaderboard };
}

export default getUserStats;
