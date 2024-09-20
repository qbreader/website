import { tossupData, bonusData } from '../../database/qbreader/collections.js';
import mergeTwoSortedArrays from '../../server/merge-two-sorted-arrays.js';

export default async function leaderboard (limit) {
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
  return overall.slice(0, limit);
}

/**
 *
 * @param {'tossup' | 'bonus'} type - the type of questions to filter by
 * @returns
 */
async function helper (type = 'tossup') {
  const aggregation = [
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
    { $sort: { username: 1 } }
  ];

  switch (type) {
    case 'tossup': {
      const results = await tossupData.aggregate(aggregation).toArray();
      return results.map((result) => ({ ...result, tossupCount: result.total, bonusCount: 0 }));
    }
    case 'bonus': {
      const results = await bonusData.aggregate(aggregation).toArray();
      return results.map((result) => ({ ...result, tossupCount: 0, bonusCount: result.total }));
    }
  }
}
