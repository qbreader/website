import { bonuses } from '../../database/qbreader/collections.js';

/**
 * Validates that the `parts`, `answers`, and `answers_sanitized` fields have the same number of parts.
 */
export default async function bonusesValidation () {
  let total = 0;

  const aggregation1 = [
    {
      $addFields: {
        parts_length: { $size: '$parts' },
        answers_length: { $size: '$answers' }
      }
    },
    { $addFields: { valid: { $eq: ['$parts_length', '$answers_length'] } } },
    { $match: { valid: false } },
    { $sort: { 'set.name': 1, answers_length: 1 } }
  ];
  for (const bonus of await bonuses.aggregate(aggregation1).toArray()) {
    total++;
    console.log(`Bonus ${bonus._id} (${bonus.set.name}) has ${bonus.parts_length} parts and ${bonus.answers_length} answers`);
  }

  const aggregation2 = [
    {
      $addFields: {
        answers_sanitized_length: { $size: '$answers_sanitized' },
        answers_length: { $size: '$answers' }
      }
    },
    { $addFields: { valid: { $eq: ['$answers_sanitized_length', '$answers_length'] } } },
    { $match: { valid: false } },
    { $sort: { 'set.name': 1, answers_length: 1 } }
  ];
  for (const bonus of await bonuses.aggregate(aggregation2).toArray()) {
    total++;
    console.log(`Bonus ${bonus._id} has ${bonus.answers_sanitized_length} sanitized answers and ${bonus.answers_length} answers`);
  }

  return total;
}
