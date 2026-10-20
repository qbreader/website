import { packets } from './collections.js';

import isAdminById from '../account-info/is-admin-by-id.js';

async function hasAnyPacketPrivileges (userId) {
  if (!userId) {
    return false;
  }

  if (await isAdminById(userId)) {
    return true;
  }

  const packet = await packets.findOne({ specialUsers: userId }, { projection: { _id: 1 } });
  return !!packet;
}

export default hasAnyPacketPrivileges;
