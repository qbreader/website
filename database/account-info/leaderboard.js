import { perTossupData, perBonusData } from '../../database/qbreader/collections.js';
import mergeTwoSortedArrays from '../../server/merge-two-sorted-arrays.js';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedOverall = null;
let cachedAt = 0;

/**
 * Rank every user by the number of questions they have heard.
 * @param {Number} [limit] - the maximum number of rows to return; every row if falsy.
 * @returns {Promise<Object[]>} sorted from most to least questions heard.
 */
export default async function leaderboard (limit) {
  if (cachedOverall && Date.now() - cachedAt < CACHE_TTL) {
    return limit ? cachedOverall.slice(0, limit) : cachedOverall;
  }

  const tossupLeaderboard = await helper('tossup');
  const bonusLeaderboard = await helper('bonus');
  const overall = mergeTwoSortedArrays(
    tossupLeaderboard,
    bonusLeaderboard,
    (document) => document.username,
    (document1, document2) => ({ _id: document1._id, username: document1.username, tossupCount: document1.tossupCount, bonusCount: document2.bonusCount, total: document1.total + document2.total })
  );
  // sort from most to least
  overall.sort((a, b) => b.total - a.total);
  cachedOverall = overall;
  cachedAt = Date.now();
  return limit ? overall.slice(0, limit) : overall;
}

/**
 * mergeTwoSortedArrays compares usernames with < and >, so both of its inputs
 * must be ordered by that same comparison. A $sort stage orders strings by
 * their UTF-8 bytes instead, which disagrees with < and > outside ASCII.
 * @param {Object} a
 * @param {Object} b
 * @returns {Number}
 */
function byUsername (a, b) {
  if (a.username < b.username) { return -1; }
  if (a.username > b.username) { return 1; }
  return 0;
}

/**
 *
 * @param {'tossup' | 'bonus'} type - the type of questions to filter by
 * @returns
 */
async function helper (type = 'tossup') {
  const aggregation = [
    { $unwind: '$data' },
    { $addFields: { user_id: '$data.user_id' } },
    {
      $group: {
        _id: '$user_id',
        count: { $sum: 1 }
      }
    },
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
        username: { $arrayElemAt: ['$user.username', 0] },
        _id: 1,
        total: '$count'
      }
    },
    // users deleted since their buzzes were recorded have no username to rank,
    // and a null username compares as equal to every other one in the merge
    { $match: { username: { $ne: null } } }
  ];

  switch (type) {
    case 'tossup': {
      const results = await perTossupData.aggregate(aggregation).toArray();
      return results.map((result) => ({ ...result, tossupCount: result.total, bonusCount: 0 })).sort(byUsername);
    }
    case 'bonus': {
      const results = await perBonusData.aggregate(aggregation).toArray();
      return results.map((result) => ({ ...result, tossupCount: 0, bonusCount: result.total })).sort(byUsername);
    }
  }
}
