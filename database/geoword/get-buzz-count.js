import { buzzes } from './collections.js';

async function getBuzzCount (packetName, user_id) {
  return await buzzes.countDocuments({ 'packet.name': packetName, user_id });
}

export default getBuzzCount;
