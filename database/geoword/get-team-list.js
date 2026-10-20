import { teams } from './collections.js';

/**
 * @param {ObjectId} setId
 * @returns {Promise<Array<{ teamName: string, memberCount: number }>>} every team in the set, by name
 */
async function getTeamList (setId) {
  return await teams.aggregate([
    { $match: { 'set._id': setId } },
    { $sort: { teamName: 1 } },
    { $project: { _id: 0, teamName: 1, memberCount: { $size: '$members' } } }
  ], { collation: { locale: 'en', strength: 2 } }).toArray();
}

export default getTeamList;
