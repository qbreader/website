import { packets, tossups } from './collections.js';

async function getQuestionCount(packetName, division) {
    if (division === undefined) {
        const packet = await packets.findOne({ name: packetName });
        const count = await tossups.countDocuments({ 'packet.name': packetName });
        return Math.round(count / packet.divisions.length);
    }

    return await tossups.countDocuments({ 'packet.name': packetName, division });
}

export default getQuestionCount;
