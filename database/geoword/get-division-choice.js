import { divisionChoices } from './collections.js';

async function getDivisionChoice (packetName, userId) {
  const result = await divisionChoices.findOne({ 'packet.name': packetName, user_id: userId });
  return result?.division;
}

export default getDivisionChoice;
