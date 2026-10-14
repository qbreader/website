import { packets } from './collections.js';

import isAdminById from '../account-info/is-admin-by-id.js';

/**
 * Admins, and the special users listed on the packet itself (`specialUsers`), get elevated access
 * to a packet: they can reach it while it is unpublished, skip payment, view results early,
 * and their buzzes don't count toward standings. A special user has these privileges for that
 * one packet only, and no other admin powers.
 * @param {String} packetName
 * @param {ObjectId} userId
 * @returns {Promise<Boolean>}
 */
async function hasPacketPrivileges (packetName, userId) {
  if (!userId) {
    return false;
  }

  if (await isAdminById(userId)) {
    return true;
  }

  const packet = await packets.findOne({ name: packetName, specialUsers: userId }, { projection: { _id: 1 } });
  return !!packet;
}

export default hasPacketPrivileges;
