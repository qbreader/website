import { packets } from './collections.js';

export default async function getPacketMetadata (setId) {
  const aggregation = [
    { $match: { 'set._id': setId } },
    {
      $lookup: {
        from: 'tossups',
        localField: '_id',
        foreignField: 'packet._id',
        as: 'tossups'
      }
    },
    {
      $lookup: {
        from: 'bonuses',
        localField: '_id',
        foreignField: 'packet._id',
        as: 'bonuses'
      }
    },
    {
      $group: {
        _id: '$_id',
        packetName: { $first: '$name' },
        packetNumber: { $first: '$number' },
        setName: { $first: '$set.name' },
        tossupCount: { $sum: { $size: '$tossups' } },
        bonusCount: { $sum: { $size: '$bonuses' } }
      }
    },
    { $sort: { packetNumber: 1 } }
  ];

  return await packets.aggregate(aggregation).toArray();
}
