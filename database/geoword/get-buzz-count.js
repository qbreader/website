import { buzzes } from './collections.js';

async function getBuzzCount (packetName, userId) {
  return await buzzes.countDocuments({ 'packet.name': packetName, user_id: userId });
}

export default getBuzzCount;
