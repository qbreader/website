import { buzzes } from './collections.js';

async function resolveProtest(buzz_id, decision, reason) {
    const updateDocument = { pendingProtest: false, decision, reason };

    if (decision === 'accept') {
        const buzz = await buzzes.findOne({ _id: buzz_id });
        updateDocument.points = 10 + Math.round(10 * buzz.celerity);
    }

    return await buzzes.updateOne(
        { _id: buzz_id },
        { $set: updateDocument },
    );
}

export default resolveProtest;
