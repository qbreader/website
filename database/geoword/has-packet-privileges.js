import { packets, sets } from './collections.js';

import isAdminById from '../account-info/is-admin-by-id.js';

/**
 * Admins, and the special users listed on the packet's set (`specialUsers`) or on the packet itself,
 * get elevated access to a packet: they can reach it while it is unpublished, skip payment, view
 * results early, and their buzzes don't count toward standings. A special user has these
 * privileges for the packets they are listed on, and no other admin powers.
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

  const packet = await packets.findOne({ name: packetName }, { projection: { set: 1, specialUsers: 1 } });
  if (!packet) {
    return false;
  }
  if (packet.specialUsers?.some(specialUser => String(specialUser) === String(userId))) {
    return true;
  }

  return !!packet.set && !!await sets.findOne({ _id: packet.set._id, specialUsers: userId }, { projection: { _id: 1 } });
}

export default hasPacketPrivileges;
