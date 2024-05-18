import getStatsHelper from './get-stats-helper.js';
import getUserId from '../get-user-id.js';

async function getAlternateSubcategoryStats ({ username, questionType, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
  const user_id = await getUserId(username);
  return await getStatsHelper({ user_id, questionType, groupByField: 'alternate_subcategory', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
}

export default getAlternateSubcategoryStats;
