import { sets } from './collections.js';

export default async function getSetMetadata (limit) {
  const aggregation = [
    {
      $lookup: {
        from: 'tossups',
        localField: '_id',
        foreignField: 'set._id',
        as: 'tossups'
      }
    },
    {
      $lookup: {
        from: 'bonuses',
        localField: '_id',
        foreignField: 'set._id',
        as: 'bonuses'
      }
    },
    {
      $lookup: {
        from: 'packets',
        localField: '_id',
        foreignField: 'set._id',
        as: 'packets'
      }
    },
    {
      $group: {
        _id: '$_id',
        setName: { $first: '$name' },
        difficulty: { $first: '$difficulty' },
        standard: { $first: '$standard' },
        packetCount: { $sum: { $size: '$packets' } },
        tossupCount: { $sum: { $size: '$tossups' } },
        bonusCount: { $sum: { $size: '$bonuses' } },
        year: { $first: '$year' }
      }
    },
    { $sort: { year: -1, setName: 1 } }
  ];

  if (isFinite(limit) && limit > 0) {
    aggregation.push({ $limit: limit });
  }

  return await sets.aggregate(aggregation).toArray();
}
