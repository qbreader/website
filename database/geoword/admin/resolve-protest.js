import { buzzes } from '../collections.js';
import overrideBuzz from './override-buzz.js';

/**
 * Resolves a pending protest. Accepting a protest overrides the buzz to be correct.
 * @param {object} params
 * @param {ObjectId} params.buzzId
 * @param {String} params.packetName - the buzz must belong to this packet
 * @param {'accept' | 'deny'} params.decision
 * @param {String} params.reason
 * @param {ObjectId} params.adminId
 * @returns {Promise<import('mongodb').UpdateResult | null>} `null` if the buzz doesn't exist or has no pending protest.
 */
async function resolveProtest ({ buzzId, packetName, decision, reason, adminId }) {
  const buzz = await buzzes.findOne({ _id: buzzId, 'packet.name': packetName, pendingProtest: true });
  if (!buzz) { return null; }

  if (decision === 'accept') {
    // matches nothing if an admin already overrode the buzz to be correct, which is fine
    await overrideBuzz({ buzzId, packetName, isCorrect: true, reason, adminId });
  }

  return await buzzes.updateOne(
    { _id: buzzId },
    { $set: { pendingProtest: false, decision, reason } }
  );
}

export default resolveProtest;
