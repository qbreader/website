import { buzzes } from '../collections.js';

/**
 * Undoes an override, restoring the buzz's original verdict and points.
 * @param {object} params
 * @param {ObjectId} params.buzzId
 * @param {String} params.packetName - the buzz must belong to this packet
 * @returns {Promise<import('mongodb').UpdateResult>} `matchedCount` is 0 if the buzz doesn't exist or isn't overridden.
 */
async function revertOverride ({ buzzId, packetName }) {
  return await buzzes.updateOne(
    { _id: buzzId, 'packet.name': packetName, override: { $exists: true } },
    [
      { $set: { isCorrect: '$override.original.isCorrect', points: '$override.original.points' } },
      { $unset: 'override' }
    ]
  );
}

export default revertOverride;
