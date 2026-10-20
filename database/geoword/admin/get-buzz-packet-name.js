import { buzzes } from '../collections.js';

async function getBuzzPacketName (buzzId) {
  const buzz = await buzzes.findOne({ _id: buzzId }, { projection: { 'packet.name': 1 } });
  return buzz?.packet?.name ?? null;
}

export default getBuzzPacketName;
