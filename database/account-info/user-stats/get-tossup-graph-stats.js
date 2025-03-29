import { perTossupData } from '../collections.js';
import generateMatchDocument from './generate-match-document.js';

async function getTossupGraphStats ({ user_id: userId, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
  const matchDocument = await generateMatchDocument({ userId, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });

  const stats = await perTossupData.aggregate([
    { $addFields: { createdAt: { $toDate: '$_id' } } },
    { $match: matchDocument },
    {
      $addFields: {
        result: {
          $switch: {
            branches: [
              { case: { $eq: ['$pointValue', 15] }, then: 'power' },
              { case: { $eq: ['$pointValue', 10] }, then: 'ten' },
              { case: { $eq: ['$pointValue', 0] }, then: 'dead' },
              { case: { $eq: ['$pointValue', -5] }, then: 'neg' }
            ],
            default: 'other'
          }
        },
        createdAt: {
          $dateTrunc: {
            date: '$createdAt',
            unit: 'day',
            binSize: 1,
            timezone: 'America/New_York'
          }
        }
      }
    },
    {
      $group: {
        _id: '$createdAt',
        pptu: { $avg: '$pointValue' },
        count: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        powers: { $sum: { $cond: [{ $eq: ['$result', 'power'] }, 1, 0] } },
        tens: { $sum: { $cond: [{ $eq: ['$result', 'ten'] }, 1, 0] } },
        deads: { $sum: { $cond: [{ $eq: ['$result', 'dead'] }, 1, 0] } },
        negs: { $sum: { $cond: [{ $eq: ['$result', 'neg'] }, 1, 0] } },
        totalPoints: { $sum: '$pointValue' },
        totalCorrectCelerity: { $sum: { $cond: ['$isCorrect', '$celerity', 0] } },
        averageCelerity: { $avg: '$celerity' }
      }
    },
    {
      $addFields: {
        averageCorrectCelerity: { $cond: ['$correct', { $divide: ['$totalCorrectCelerity', '$correct'] }, 0] }
      }
    },
    { $sort: { _id: 1 } }
  ]).toArray();

  return { stats };
}

export default getTossupGraphStats;
