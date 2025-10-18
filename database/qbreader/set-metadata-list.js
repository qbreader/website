import { sets } from './collections.js';

/**
 * Retrieves metadata for quiz bowl sets with optional question counts.
 *
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.limit] - Maximum number of results to return (must be finite and > 0)
 * @param {boolean} [options.includeCounts=true] - Whether to include packet, tossup, and bonus counts
 * @returns {Promise<Array<Object>>} Array of set metadata objects containing:
 *   - _id: Set identifier
 *   - setName: Name of the set
 *   - difficulty: Difficulty level of the set
 *   - standard: Standard classification
 *   - year: Year of the set
 *   - packets: Packet information (always included)
 *   - tossups: Tossup question counts (if includeCounts is true)
 *   - bonuses: Bonus question counts (if includeCounts is true)
 *
 * Results are sorted by year (descending) then by set name (ascending).
 */
export default async function getSetMetadata ({ limit, includeCounts = true } = {}) {
  let aggregation = [
    {
      $group: {
        _id: '$_id',
        setName: { $first: '$name' },
        difficulty: { $first: '$difficulty' },
        standard: { $first: '$standard' },
        year: { $first: '$year' }
      }
    },
    { $sort: { year: -1, setName: 1 } }
  ];

  if (includeCounts) {
    aggregation = updateAggregation(aggregation, 'packets');
    aggregation = updateAggregation(aggregation, 'tossups');
    aggregation = updateAggregation(aggregation, 'bonuses');
  }

  if (isFinite(limit) && limit > 0) {
    aggregation.push({ $limit: limit });
  }

  return await sets.aggregate(aggregation).toArray();
}

function updateAggregation (aggregation, field) {
  aggregation.at(-2).$group[`${field}Count`] = { $sum: { $size: `$${field}` } };
  const stage = {
    $lookup: {
      from: field,
      localField: '_id',
      foreignField: 'set._id',
      as: field
    }
  };
  return [stage, ...aggregation];
}
