import { perTossupData } from '../collections.js';

export default async function getAllTossupStats (userId) {
  const stats = await perTossupData.aggregate([
    { $match: { 'data.user_id': userId } },
    { $unwind: '$data' },
    { $match: { 'data.user_id': userId } },
    {
      $project: {
        _id: 0,
        created: '$data.created',
        tossup_id: '$_id',
        set_id: 1,
        difficulty: 1,
        category: 1,
        subcategory: 1,
        alternate_subcategory: 1,
        multiplayer: '$data.multiplayer',
        ceierity: '$data.celerity',
        pointValue: '$data.pointValue'
      }
    }
  ]).toArray();

  const csv = stats.map(stat => [
    stat.created,
    stat.tossup_id,
    stat.set_id,
    stat.difficulty,
    stat.category,
    stat.subcategory,
    stat.alternate_subcategory ?? '',
    stat.multiplayer,
    stat.ceierity,
    stat.pointValue
  ]);

  return csv;
}
