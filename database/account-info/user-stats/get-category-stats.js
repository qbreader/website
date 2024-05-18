import getStatsHelper from './get-stats-helper.js';
import getUserId from '../get-user-id.js';

async function getCategoryStats ({ username, questionType, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
  const user_id = await getUserId(username);
  return await getStatsHelper({ user_id, questionType, groupByField: 'category', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
}

export default getCategoryStats;
