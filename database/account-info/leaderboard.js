import { perTossupData, perBonusData } from '../../database/qbreader/collections.js';
import mergeTwoSortedArrays from '../../server/merge-two-sorted-arrays.js';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedOverall = null;
let cachedAt = 0;

/**
 * @typedef {Object} LeaderboardRow
 * @property {ObjectId} _id - the user's _id
 * @property {String} username
 * @property {Number} tossupCount - tossups heard
 * @property {Number} bonusCount - bonuses heard
 * @property {Number} total - tossupCount + bonusCount
 * @property {Number} numCorrect - tossups answered correctly
 * @property {Number} powers - tossups buzzed for 15 or more
 * @property {Number} tens - tossups buzzed for exactly 10
 * @property {Number} negs - tossups buzzed for a negative value
 * @property {Number} tossupPoints
 * @property {Number} bonusPoints
 * @property {Number} points - tossupPoints + bonusPoints
 * @property {Number} pptu - points per tossup heard
 * @property {Number} ppb - points per bonus heard
 * @property {Number} accuracy - numCorrect / tossupCount, in [0, 1]
 * @property {Number} averageCorrectCelerity - in [0, 1]; higher means an earlier buzz
 */

/**
 * Rank every user by the number of questions they have heard.
 * Results are cached for five minutes, since the underlying aggregations
 * unwind the entirety of per-tossup-data and per-bonus-data.
 * @param {Number} [limit] - the maximum number of rows to return; all rows if falsy.
 * @returns {Promise<LeaderboardRow[]>} sorted from most to least questions heard.
 */
export default async function leaderboard (limit) {
  if (!cachedOverall || Date.now() - cachedAt >= CACHE_TTL) {
    const tossupLeaderboard = await tossupHelper();
    const bonusLeaderboard = await bonusHelper();
    const overall = mergeTwoSortedArrays(
      tossupLeaderboard,
      bonusLeaderboard,
      (document) => document.username,
      combineRows
    );
    // sort from most to least
    overall.sort((a, b) => b.total - a.total);
    cachedOverall = overall;
    cachedAt = Date.now();
  }

  return limit ? cachedOverall.slice(0, limit) : cachedOverall;
}

/**
 * When the currently cached leaderboard was computed.
 * @returns {Date | null} null if the leaderboard has not been computed yet.
 */
export function lastGeneratedAt () {
  return cachedOverall ? new Date(cachedAt) : null;
}

/**
 * Combine a user's tossup-only row with their bonus-only row.
 * @param {LeaderboardRow} tossupRow
 * @param {LeaderboardRow} bonusRow
 * @returns {LeaderboardRow}
 */
function combineRows (tossupRow, bonusRow) {
  return {
    ...tossupRow,
    bonusCount: bonusRow.bonusCount,
    bonusPoints: bonusRow.bonusPoints,
    ppb: bonusRow.ppb,
    total: tossupRow.total + bonusRow.total,
    points: tossupRow.points + bonusRow.points
  };
}

/**
 * Look the username up for each grouped user_id and drop users that no longer exist.
 * @param {Object} projection - the fields to keep alongside _id and username.
 * @returns {Object[]} the trailing stages shared by both aggregations.
 */
function usernameStages (projection) {
  return [
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $project: {
        _id: 1,
        username: { $arrayElemAt: ['$user.username', 0] },
        ...projection
      }
    },
    // users deleted since their buzzes were recorded have no username to rank
    { $match: { username: { $ne: null } } }
  ];
}

/**
 * mergeTwoSortedArrays compares usernames with < and >, so both inputs must be
 * sorted by that same comparison. Sorting here rather than with a $sort stage
 * keeps the ordering in one place and avoids an unindexed server-side sort.
 * @param {LeaderboardRow} a
 * @param {LeaderboardRow} b
 * @returns {Number}
 */
function byUsername (a, b) {
  if (a.username < b.username) { return -1; }
  if (a.username > b.username) { return 1; }
  return 0;
}

/**
 * @returns {Promise<LeaderboardRow[]>} one row per user, with the bonus fields zeroed.
 */
async function tossupHelper () {
  const results = await perTossupData.aggregate([
    { $unwind: '$data' },
    { $match: { 'data.user_id': { $ne: null } } },
    {
      $group: {
        _id: '$data.user_id',
        tossupCount: { $sum: 1 },
        numCorrect: { $sum: { $cond: ['$data.isCorrect', 1, 0] } },
        powers: { $sum: { $cond: [{ $gte: ['$data.pointValue', 15] }, 1, 0] } },
        tens: { $sum: { $cond: [{ $eq: ['$data.pointValue', 10] }, 1, 0] } },
        negs: { $sum: { $cond: [{ $lt: ['$data.pointValue', 0] }, 1, 0] } },
        tossupPoints: { $sum: '$data.pointValue' },
        totalCorrectCelerity: { $sum: { $cond: ['$data.isCorrect', '$data.celerity', 0] } }
      }
    },
    ...usernameStages({
      tossupCount: 1,
      numCorrect: 1,
      powers: 1,
      tens: 1,
      negs: 1,
      tossupPoints: 1,
      pptu: { $cond: ['$tossupCount', { $divide: ['$tossupPoints', '$tossupCount'] }, 0] },
      accuracy: { $cond: ['$tossupCount', { $divide: ['$numCorrect', '$tossupCount'] }, 0] },
      averageCorrectCelerity: { $cond: ['$numCorrect', { $divide: ['$totalCorrectCelerity', '$numCorrect'] }, 0] }
    })
  ]).toArray();

  return results.map((result) => ({
    ...result,
    bonusCount: 0,
    bonusPoints: 0,
    ppb: 0,
    total: result.tossupCount,
    points: result.tossupPoints
  })).sort(byUsername);
}

/**
 * @returns {Promise<LeaderboardRow[]>} one row per user, with the tossup fields zeroed.
 */
async function bonusHelper () {
  const results = await perBonusData.aggregate([
    { $unwind: '$data' },
    { $match: { 'data.user_id': { $ne: null } } },
    { $addFields: { pointsThisBonus: { $sum: '$data.pointsPerPart' } } },
    {
      $group: {
        _id: '$data.user_id',
        bonusCount: { $sum: 1 },
        bonusPoints: { $sum: '$pointsThisBonus' }
      }
    },
    ...usernameStages({
      bonusCount: 1,
      bonusPoints: 1,
      ppb: { $cond: ['$bonusCount', { $divide: ['$bonusPoints', '$bonusCount'] }, 0] }
    })
  ]).toArray();

  return results.map((result) => ({
    ...result,
    tossupCount: 0,
    numCorrect: 0,
    powers: 0,
    tens: 0,
    negs: 0,
    tossupPoints: 0,
    pptu: 0,
    accuracy: 0,
    averageCorrectCelerity: 0,
    total: result.bonusCount,
    points: result.bonusPoints
  })).sort(byUsername);
}
