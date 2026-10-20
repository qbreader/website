import { packets } from './collections.js';

import isAdminById from '../account-info/is-admin-by-id.js';

async function getManagedPacketList (userId) {
  const filter = (await isAdminById(userId)) ? {} : { specialUsers: userId };

  return await packets.find(
    filter,
    {
      sort: { order: 1 },
      projection: { name: 1, divisions: 1, _id: 0 }
    }
  ).toArray();
}

export default getManagedPacketList;
