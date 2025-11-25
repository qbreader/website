import { perBonusData } from '../collections.js';

export default async function getAllBonusStats (userId) {
  const stats = await perBonusData.aggregate([
    { $match: { 'data.user_id': userId } },
    { $unwind: '$data' },
    { $match: { 'data.user_id': userId } },
    {
      $project: {
        _id: 0,
        created: '$data.created',
        bonus_id: '$_id',
        difficulty: 1,
        category: 1,
        subcategory: 1,
        alternate_subcategory: 1,
        set_id: 1,
        pointsPerPart: '$data.pointsPerPart'
      }
    }
  ]).toArray();

  const csv = stats.map(stat => [
    stat.created,
    stat.bonus_id,
    stat.set_id,
    stat.difficulty,
    stat.category,
    stat.subcategory,
    stat.alternate_subcategory ?? '',
    stat.multiplayer ?? false,
    ...stat.pointsPerPart
  ]);

  return csv;
}
