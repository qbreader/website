import { perBonusData } from '../collections.js';

/**
 * Get the stats for a single bonus.
 * @param {ObjectId} bonusId the bonus id
 * @returns {Promise<Document>} the bonus stats
 */
async function getSingleBonusStats (bonusId) {
  const document = await perBonusData.findOne({ _id: bonusId });
  if (!document) { return null; }
  document.data.forEach(d => { d.pointValue = d.pointsPerPart.reduce((a, b) => a + b, 0); });
  return {
    _id: bonusId,
    '30s': document.data.filter(d => d.pointValue === 30).length,
    '20s': document.data.filter(d => d.pointValue === 20).length,
    '10s': document.data.filter(d => d.pointValue === 10).length,
    '0s': document.data.filter(d => d.pointValue === 0).length,
    count: document.data.length,
    part1: document.data.reduce((a, b) => a + (b.pointsPerPart[0] > 0 ? 1 : 0), 0) / document.data.length,
    part2: document.data.reduce((a, b) => a + (b.pointsPerPart[1] > 0 ? 1 : 0), 0) / document.data.length,
    part3: document.data.reduce((a, b) => a + (b.pointsPerPart[2] > 0 ? 1 : 0), 0) / document.data.length,
    ppb: document.data.reduce((a, b) => a + b.pointValue, 0) / document.data.length,
    totalPoints: document.data.reduce((a, b) => a + b.pointValue, 0)
  };
}

export default getSingleBonusStats;
