import { tossups } from '../../collections.js';

async function getPacket (packetName, division) {
  return await tossups.find(
    { 'packet.name': packetName, division },
    { sort: { questionNumber: 1 } }
  ).toArray();
}

export default getPacket;
