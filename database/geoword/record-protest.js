import { buzzes } from './collections.js';

async function recordProtest(packetName, questionNumber, user_id) {
    return await buzzes.updateOne(
        { 'packet.name': packetName, questionNumber, user_id },
        { $set: { pendingProtest: true } },
    );
}

export default recordProtest;
