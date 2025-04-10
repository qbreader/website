import { perTossupData } from '../collections.js';

/**
 * Get the stats for a single tossup.
 * @param {ObjectId} tossupId the tossup id
 * @returns {Promise<Document>} the tossup stats
 */
async function getSingleTossupStats (tossupId) {
  const document = await perTossupData.findOne({ _id: tossupId });
  if (!document) { return null; }
  const data = document.data;
  // data should always be an array
  if (!Array.isArray(data) || data.length === 0) { return null; }
  return {
    _id: tossupId,
    '15s': data.filter(d => d.pointValue > 10).length,
    '10s': data.filter(d => d.pointValue === 10).length,
    '-5s': data.filter(d => d.pointValue < 0).length,
    count: data.length,
    numCorrect: data.reduce((a, b) => a + (b.pointValue > 0 ? 1 : 0), 0),
    pptu: data.reduce((a, b) => a + b.pointValue, 0) / data.length,
    totalCelerity: data.reduce((a, b) => a + b.celerity, 0),
    totalCorrectCelerity: data.reduce((a, b) => a + (b.pointValue > 0 ? b.celerity : 0), 0),
    totalPoints: data.reduce((a, b) => a + b.pointValue, 0)
  };
}

export default getSingleTossupStats;
