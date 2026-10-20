import { packets } from './collections.js';

/**
 * @param {ObjectId} setId
 * @returns {Promise<String[]>} every division offered by a public packet in the set
 */
async function getSetDivisions (setId) {
  return await packets.distinct('divisions', { 'set._id': setId, test: { $ne: true } });
}

export default getSetDivisions;
