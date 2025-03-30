import { perTossupData } from '../collections.js';

/**
 * Get the stats for a single tossup.
 * @param {ObjectId} tossupId the tossup id
 * @returns {Promise<Document>} the tossup stats
 */
async function getSingleTossupStats (tossupId) {
  const document = await perTossupData.findOne({ _id: tossupId });
  if (!document) { return null; }
  return {
    _id: tossupId,
    '15s': document.data.filter(d => d.pointValue > 10).length,
    '10s': document.data.filter(d => d.pointValue === 10).length,
    '-5s': document.data.filter(d => d.pointValue < 0).length,
    count: document.data.length,
    numCorrect: document.data.reduce((acc, curr) => acc + (curr.pointValue > 0 ? 1 : 0), 0),
    pptu: document.data.reduce((acc, curr) => acc + curr.pointValue, 0) / document.data.length,
    totalCelerity: document.data.reduce((acc, curr) => acc + curr.celerity, 0),
    totalCorrectCelerity: document.data.reduce((acc, curr) => acc + (curr.pointValue > 0 ? curr.celerity : 0), 0),
    totalPoints: document.data.reduce((acc, curr) => acc + curr.pointValue, 0)
  };
}

export default getSingleTossupStats;
