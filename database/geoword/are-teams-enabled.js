import getPacketSet from './get-packet-set.js';
import getSet from './get-set.js';

/**
 * @param {Object} options give one of `packetName` or `setName`
 * @param {String} [options.packetName] the packet whose set to check
 * @param {String} [options.setName]
 * @returns {Promise<boolean>} whether the set has teams enabled; false if it doesn't exist
 */
async function areTeamsEnabled ({ packetName, setName }) {
  setName ??= (await getPacketSet(packetName))?.name;
  if (!setName) { return false; }
  return Boolean((await getSet(setName))?.teams?.enabled);
}

export default areTeamsEnabled;
