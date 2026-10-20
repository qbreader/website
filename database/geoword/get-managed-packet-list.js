import { packets, sets } from './collections.js';

import isAdminById from '../account-info/is-admin-by-id.js';

async function getManagedPacketList (userId) {
  const managedSetIds = (await isAdminById(userId))
    ? []
    : (await sets.find({ specialUsers: userId }, { projection: { _id: 1 } }).toArray()).map(set => set._id);
  const filter = (await isAdminById(userId)) ? {} : { $or: [{ specialUsers: userId }, { 'set._id': { $in: managedSetIds } }] };

  return await packets.find(
    filter,
    {
      sort: { order: 1 },
      projection: { name: 1, divisions: 1, _id: 0 }
    }
  ).toArray();
}

export default getManagedPacketList;
