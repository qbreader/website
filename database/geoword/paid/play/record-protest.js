import { buzzes } from '../../collections.js';

/**
 * Marks an incorrect buzz as protested. Buzzes that are correct, or that have
 * already been protested (pending or resolved), are left untouched.
 * @param {String} packetName
 * @param {Number} questionNumber
 * @param {ObjectId} userId
 * @returns {Promise<import('mongodb').UpdateResult>} `matchedCount` is 0 if the buzz cannot be protested.
 */
async function recordProtest (packetName, questionNumber, userId) {
  return await buzzes.updateOne(
    {
      'packet.name': packetName,
      questionNumber,
      user_id: userId,
      points: { $lte: 0 },
      pendingProtest: { $exists: false }
    },
    { $set: { pendingProtest: true } }
  );
}

export default recordProtest;
