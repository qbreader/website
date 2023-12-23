import { packets, payments } from './collections.js';

async function recordPayment(packetName, user_id) {
    const packet = await packets.findOne({ name: packetName });
    return await payments.replaceOne(
        { user_id, 'packet.name': packetName },
        { user_id, packet: { _id: packet._id, name: packetName }, createdAt: new Date() },
        { upsert: true },
    );
}

export default recordPayment;
