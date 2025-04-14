import { buzzes } from '../collections.js';

async function resolveProtest (buzzId, decision, reason) {
  const updateDocument = { pendingProtest: false, decision, reason };

  if (decision === 'accept') {
    const buzz = await buzzes.findOne({ _id: buzzId });
    updateDocument.points = 10 + Math.round(10 * buzz.celerity);
  }

  return await buzzes.updateOne(
    { _id: buzzId },
    { $set: updateDocument }
  );
}

export default resolveProtest;
