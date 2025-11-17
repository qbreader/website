import { packets } from './collections.js';

/**
 * Gets the maximum packet number from a collection of packets for the specified set names.
 *
 * @param {string[]} setNames - An array of set names to query for the maximum packet number.
 * @returns {Promise<number>} A promise that resolves to the maximum packet number found, or 0 if no packets exist or the input is invalid.
 *
 * @example
 * const maxNumber = await getMaxPacketNumber(['2023 ACF Nationals', '2023 ACF Regionals']);
 * console.log(maxNumber); // 25
 */
export default async function getMaxPacketNumber (setNames) {
  if (!Array.isArray(setNames) || setNames.length === 0) { return 0; }

  const result = await packets.aggregate([
    { $match: { 'set.name': { $in: setNames } } },
    { $group: { _id: null, maxPacketNumber: { $max: '$number' } } }
  ]).toArray();

  if (result.length === 0) { return 0; }

  return result[0].maxPacketNumber;
}
