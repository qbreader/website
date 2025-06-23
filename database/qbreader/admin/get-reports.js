import { bonuses, tossups } from '../collections.js';

// eslint-disable-next-line no-unused-vars
import * as types from '../../../types.js';

/**
 *
 * @param {"wrong-category" | "text-error"} reason
 * @returns {Promise<{tossups: types.Tossup[], bonuses: types.Bonus[]}>}
 */
async function getReports (reason) {
  const reports = {};
  reports.tossups = await tossups.find({ 'reports.reason': reason }, { sort: { 'set.year': -1 } }).toArray();
  reports.bonuses = await bonuses.find({ 'reports.reason': reason }, { sort: { 'set.year': -1 } }).toArray();
  return reports;
}

export default getReports;
