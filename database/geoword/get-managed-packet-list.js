import { packets, sets } from './collections.js';

import isAdminById from '../account-info/is-admin-by-id.js';

async function getManagedPacketList (userId) {
  const filter = (await isAdminById(userId))
    ? {}
    : { 'set._id': { $in: (await sets.find({ specialUsers: userId }, { projection: { _id: 1 } }).toArray()).map(set => set._id) } };

  return await packets.find(
    filter,
    {
      sort: { order: 1 },
      projection: { name: 1, divisions: 1, test: 1, _id: 0 }
    }
  ).toArray();
}

export default getManagedPacketList;
