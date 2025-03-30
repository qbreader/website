import { perTossupData } from '../collections.js';
import generateMatchDocument from './generate-match-document.js';

async function getTossupGraphStats (userId, query) {
  const matchDocument = await generateMatchDocument({ userId, ...query });

  return await perTossupData.aggregate([
    { $match: matchDocument },
    { $unwind: '$data' },
    { $match: { 'data.user_id': userId } },
    {
      $addFields: {
        result: {
          $switch: {
            branches: [
              { case: { $eq: ['$data.pointValue', 15] }, then: 'power' },
              { case: { $eq: ['$data.pointValue', 10] }, then: 'ten' },
              { case: { $eq: ['$data.pointValue', 0] }, then: 'dead' },
              { case: { $eq: ['$data.pointValue', -5] }, then: 'neg' }
            ],
            default: 'other'
          }
        },
        created: {
          $dateTrunc: {
            date: '$data.created',
            unit: 'day',
            binSize: 1,
            timezone: 'America/New_York'
          }
        }
      }
    },
    {
      $group: {
        _id: '$created',
        pptu: { $avg: '$data.pointValue' },
        count: { $sum: 1 },
        correct: { $sum: { $cond: ['$data.isCorrect', 1, 0] } },
        powers: { $sum: { $cond: [{ $eq: ['$result', 'power'] }, 1, 0] } },
        tens: { $sum: { $cond: [{ $eq: ['$result', 'ten'] }, 1, 0] } },
        deads: { $sum: { $cond: [{ $eq: ['$result', 'dead'] }, 1, 0] } },
        negs: { $sum: { $cond: [{ $eq: ['$result', 'neg'] }, 1, 0] } },
        totalPoints: { $sum: '$data.pointValue' },
        totalCorrectCelerity: { $sum: { $cond: ['$data.isCorrect', '$data.celerity', 0] } },
        averageCelerity: { $avg: '$data.celerity' }
      }
    },
    {
      $addFields: {
        averageCorrectCelerity: { $cond: ['$correct', { $divide: ['$totalCorrectCelerity', '$correct'] }, 0] }
      }
    },
    { $sort: { _id: 1 } }
  ]).toArray();
}

export default getTossupGraphStats;
