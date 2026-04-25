import { bonuses, tossups } from '../../database/qbreader/collections.js';

export default async function packetValidation () {
  let total = 0;

  const aggregation = [
    { $lookup: { from: 'packets', localField: 'packet._id', foreignField: '_id', as: 'correctPacket' } },
    { $unwind: '$correctPacket' },
    {
      $match: {
        $or: [
          { $expr: { $ne: ['$correctPacket.name', '$packet.name'] } },
          { $expr: { $ne: ['$correctPacket.number', '$packet.number'] } }
        ]
      }
    }
  ];

  for (const [collectionName, collection] of [['tossups', tossups], ['bonuses', bonuses]]) {
    const results = await collection.aggregate(aggregation).toArray();
    total += results.length;
    const bulkOp = collection.initializeUnorderedBulkOp();

    for (const q of results) {
      bulkOp.find({ _id: q._id }).updateOne({
        $set: {
          'packet.name': q.correctPacket.name,
          'packet.number': q.correctPacket.number
        }
      });
    }

    if (results.length > 0) {
      await bulkOp.execute();
    }

    console.log(`fixed packet fields of ${results.length} ${collectionName}`);
  }

  return total;
}
