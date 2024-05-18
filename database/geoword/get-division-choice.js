import { divisionChoices } from './collections.js';

async function getDivisionChoice (packetName, user_id) {
  const result = await divisionChoices.findOne({ 'packet.name': packetName, user_id });
  return result?.division;
}

export default getDivisionChoice;
