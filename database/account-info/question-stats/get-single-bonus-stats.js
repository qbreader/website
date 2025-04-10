import { perBonusData } from '../collections.js';

/**
 * Get the stats for a single bonus.
 * @param {ObjectId} bonusId the bonus id
 * @returns {Promise<Document>} the bonus stats
 */
async function getSingleBonusStats (bonusId) {
  const document = await perBonusData.findOne({ _id: bonusId });
  if (!document) { return null; }
  const data = document.data;
  // data should always be an array
  if (data.length === 0) { return null; }
  data.forEach(d => { d.pointValue = d.pointsPerPart.reduce((a, b) => a + b, 0); });
  return {
    _id: bonusId,
    '30s': data.filter(d => d.pointValue === 30).length,
    '20s': data.filter(d => d.pointValue === 20).length,
    '10s': data.filter(d => d.pointValue === 10).length,
    '0s': data.filter(d => d.pointValue === 0).length,
    count: data.length,
    part1: data.reduce((a, b) => a + (b.pointsPerPart[0] > 0 ? 1 : 0), 0) / data.length,
    part2: data.reduce((a, b) => a + (b.pointsPerPart[1] > 0 ? 1 : 0), 0) / data.length,
    part3: data.reduce((a, b) => a + (b.pointsPerPart[2] > 0 ? 1 : 0), 0) / data.length,
    ppb: data.reduce((a, b) => a + b.pointValue, 0) / data.length,
    totalPoints: data.reduce((a, b) => a + b.pointValue, 0)
  };
}

export default getSingleBonusStats;
