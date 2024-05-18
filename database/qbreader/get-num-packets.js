import { packets } from './collections.js';

/**
 * @param {string} setName - the name of the set (e.g. "2021 ACF Fall").
 * @returns {Promise<Number>} the number of packets in the set.
 */
async function getNumPackets (setName) {
  if (!setName) {
    return 0;
  }

  return await packets.countDocuments({ 'set.name': setName });
}

export default getNumPackets;
