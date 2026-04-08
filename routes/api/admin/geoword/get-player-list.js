import { buzzes } from '../../../../database/geoword/collections.js';

import { getUsername } from '../../../auth/get-username.js';

async function getPlayerList (packetName, division) {
  const result = await buzzes.aggregate([
    { $match: { 'packet.name': packetName, division } },
    { $group: { _id: '$user_id' } }
  ]).toArray();

  for (const index in result) {
    const userId = result[index]._id;
    result[index].username = await getUsername(userId);
  }

  result.sort((a, b) => a.username.localeCompare(b.username));

  return result;
}

export default getPlayerList;
