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
  if (!Array.isArray(data) || data.length === 0) { return null; }
  data.forEach(d => { d.pointValue = d.pointsPerPart.reduce((a, b) => a + b, 0); });

  const partConversion = [];
  for (let i = 0; i < data[0].pointsPerPart.length; i++) {
    const fraction = data.reduce((a, b) => a + (b.pointsPerPart[i] > 0 ? 1 : 0), 0) / data.length;
    partConversion.push(fraction);
  }

  // guarantee that we include 30, 20, 10, and 0
  const resultCounts = { 30: 0, 20: 0, 10: 0, 0: 0 };
  // below is just in case there are other point values
  const pointValues = new Set(data.map(d => d.pointValue));
  for (const pointValue of pointValues) {
    resultCounts[pointValue] = data.filter(d => d.pointValue === pointValue).length;
  }

  return {
    _id: bonusId,
    count: data.length,
    partConversion,
    ppb: data.reduce((a, b) => a + b.pointValue, 0) / data.length,
    resultCounts,
    totalPoints: data.reduce((a, b) => a + b.pointValue, 0)
  };
}

export default getSingleBonusStats;
