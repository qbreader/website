import { perBonusData, perTossupData } from '../collections.js';
import generateMatchDocument from './generate-match-document.js';

/**
 * @param {Object} params
 * @param {ObjectId} params.userId
 * @param {'tossup' | 'bonus'} params.questionType
 * @param {'category' | 'subcategory'} params.groupByField
 * @param {Number[]} params.difficulties
 * @param {String} params.setName
 * @param {Boolean} params.includeMultiplayer
 * @param {Boolean} params.includeSingleplayer
 * @param {Date} params.startDate
 * @param {Date} params.endDate
 * @returns
 */
async function getStatsHelper ({ userId, questionType, groupByField, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
  const matchDocument = await generateMatchDocument({ userId, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });

  switch (questionType) {
    case 'tossup':
      return await perTossupData.aggregate([
        { $addFields: { createdAt: { $toDate: '$_id' } } },
        { $match: matchDocument },
        { $match: { [groupByField]: { $exists: true } } },
        {
          $addFields: {
            is15: { $gt: ['$pointValue', 10] },
            is10: { $eq: ['$pointValue', 10] },
            isNeg5: { $lt: ['$pointValue', 0] }
          }
        },
        {
          $group: {
            numCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
            _id: '$' + groupByField,
            count: { $sum: 1 },
            '15s': { $sum: { $cond: ['$is15', 1, 0] } },
            '10s': { $sum: { $cond: ['$is10', 1, 0] } },
            '-5s': { $sum: { $cond: ['$isNeg5', 1, 0] } },
            totalCelerity: { $sum: '$celerity' },
            totalCorrectCelerity: { $sum: { $cond: ['$isCorrect', '$celerity', 0] } },
            totalPoints: { $sum: '$pointValue' },
            pptu: { $avg: '$pointValue' }
          }
        },
        {
          $addFields: {
            averageCorrectCelerity: { $cond: ['$numCorrect', { $divide: ['$totalCorrectCelerity', '$numCorrect'] }, 0] }
          }
        },
        { $sort: { pptu: -1, averageCorrectCelerity: -1, totalPoints: -1 } }
      ]).toArray();
    case 'bonus':
      return await perBonusData.aggregate([
        { $addFields: { createdAt: { $toDate: '$_id' } } },
        { $match: matchDocument },
        { $match: { [groupByField]: { $exists: true } } },
        { $addFields: { pointValue: { $sum: '$pointsPerPart' } } },
        {
          $addFields: {
            is30: { $eq: ['$pointValue', 30] },
            is20: { $eq: ['$pointValue', 20] },
            is10: { $eq: ['$pointValue', 10] },
            is0: { $eq: ['$pointValue', 0] }
          }
        },
        {
          $group: {
            _id: '$' + groupByField,
            count: { $sum: 1 },
            '30s': { $sum: { $cond: ['$is30', 1, 0] } },
            '20s': { $sum: { $cond: ['$is20', 1, 0] } },
            '10s': { $sum: { $cond: ['$is10', 1, 0] } },
            '0s': { $sum: { $cond: ['$is0', 1, 0] } },
            totalPoints: { $sum: '$pointValue' },
            ppb: { $avg: '$pointValue' }
          }
        },
        { $sort: { ppb: -1, totalPoints: -1 } }
      ]).toArray();
  }
}

export default getStatsHelper;
