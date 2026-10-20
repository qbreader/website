import { sets } from './collections.js';

import isAdminById from '../account-info/is-admin-by-id.js';

async function hasAnyPacketPrivileges (userId) {
  if (!userId) {
    return false;
  }

  if (await isAdminById(userId)) {
    return true;
  }

  return !!await sets.findOne({ specialUsers: userId }, { projection: { _id: 1 } });
}

export default hasAnyPacketPrivileges;
