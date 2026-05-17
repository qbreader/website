import { bonuses, packets, sets, tossups } from '../../database/qbreader/collections.js';

export default async function setValidation () {
  let total = 0;

  for (const set of await sets.find({}).toArray()) {
    if (set.year !== parseInt(set.name.split(' ')[0])) {
      console.log(`Invalid year ${set.year} for set: ${set.name}`);
      total++;
    }
  }

  const aggregation = [
    { $lookup: { from: 'sets', localField: 'set._id', foreignField: '_id', as: 'correctSet' } },
    { $unwind: '$correctSet' },
    {
      $match: {
        $or: [
          { $expr: { $ne: ['$correctSet.name', '$set.name'] } },
          { $expr: { $ne: ['$correctSet.standard', '$set.standard'] } },
          { $expr: { $ne: ['$correctSet.year', '$set.year'] } },
          { $expr: { $ne: ['$correctSet.difficulty', '$difficulty'] } }
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
          'set.name': q.correctSet.name,
          'set.year': q.correctSet.year,
          'set.standard': q.correctSet.standard,
          difficulty: q.correctSet.difficulty
        }
      });
    }

    if (results.length > 0) {
      await bulkOp.execute();
    }

    console.log(`fixed set fields of ${results.length} ${collectionName}`);
  }

  const packetResults = await packets.aggregate([
    { $lookup: { from: 'sets', localField: 'set._id', foreignField: '_id', as: 'correctSet' } },
    { $unwind: '$correctSet' },
    { $match: { $expr: { $ne: ['$correctSet.name', '$set.name'] } } }
  ]).toArray();

  total += packetResults.length;
  const bulkPacket = packets.initializeUnorderedBulkOp();

  for (const packet of packetResults) {
    bulkPacket.find({ _id: packet._id }).updateOne({ $set: { 'set.name': packet.correctSet.name } });
  }

  if (packetResults.length > 0) {
    await bulkPacket.execute();
  }

  console.log(`fixed set fields of ${packetResults.length} packets.`);

  return total;
}
