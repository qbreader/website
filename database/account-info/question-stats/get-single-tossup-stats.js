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

  // guarantee that we include 15, 10, 0, and -5
  const resultCounts = { 15: 0, 10: 0, 0: 0, '-5': 0 };
  // below is just in case there are other point values
  const pointValues = new Set(data.map(d => d.pointValue));
  for (const pointValue of pointValues) {
    resultCounts[pointValue] = data.filter(d => d.pointValue === pointValue).length;
  }

  return {
    _id: tossupId,
    count: data.length,
    numCorrect: data.reduce((a, b) => a + (b.pointValue > 0 ? 1 : 0), 0),
    pptu: data.reduce((a, b) => a + b.pointValue, 0) / data.length,
    resultCounts,
    totalCelerity: data.reduce((a, b) => a + b.celerity, 0),
    totalCorrectCelerity: data.reduce((a, b) => a + (b.pointValue > 0 ? b.celerity : 0), 0),
    totalPoints: data.reduce((a, b) => a + b.pointValue, 0)
  };
}

export default getSingleTossupStats;
