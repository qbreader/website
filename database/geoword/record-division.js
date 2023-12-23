import { divisionChoices, packets } from './collections.js';

async function recordDivision(packetName, division, user_id) {
    const packet = await packets.findOne({ name: packetName });
    return await divisionChoices.replaceOne(
        { user_id, 'packet.name': packetName },
        { user_id, packet: { _id: packet._id, name: packetName }, division },
        { upsert: true },
    );
}

export default recordDivision;
