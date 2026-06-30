/**
 * Idempotent index-creation script.
 *
 * Creates the MongoDB indexes that the application's existing queries already
 * filter and sort on. Adding a btree index never changes query results: it only
 * speeds up filters/sorts on the indexed fields, so this script is purely
 * additive and changes no query or search semantics (in particular, the
 * unanchored `$regex` substring search is unaffected).
 *
 * `createIndex` is idempotent: it is a no-op if an equivalent index already
 * exists, and modern MongoDB builds indexes non-blocking, so this script is
 * safe to re-run. It must be run by an operator against the database, e.g.
 * `npm run create-indexes`.
 */

import { sets, packets, tossups, bonuses } from './qbreader/collections.js';
import { tossupStars, bonusStars, perTossupData, perBonusData } from './account-info/collections.js';

// Each entry: [Mongo collection handle, index key spec, human-readable note]
const INDEXES = [
  // --- qbreader: tossups / bonuses ---------------------------------------
  // get-query sort `{ 'set.name': -1, 'packet.number': 1, number: 1 }`;
  // also serves get-set / get-pg-lookup filters and sorts on set.name + packet.number.
  [tossups, { 'set.name': -1, 'packet.number': 1, number: 1 }, 'tossups by set.name/packet.number/number (query & set listing sort)'],
  [bonuses, { 'set.name': -1, 'packet.number': 1, number: 1 }, 'bonuses by set.name/packet.number/number (query & set listing sort)'],

  // get-random-tossups / get-random-bonuses range match on set.year; also
  // used by get-frequency-list and get-query year filters.
  [tossups, { 'set.year': 1 }, 'tossups by set.year (random / frequency / year-range filters)'],
  [bonuses, { 'set.year': 1 }, 'bonuses by set.year (random / frequency / year-range filters)'],

  // get-packet finds tossups/bonuses by packet._id sorted by number; also the
  // join field for packet-metadata-list $lookup.
  [tossups, { 'packet._id': 1, number: 1 }, 'tossups by packet._id/number (get-packet & packet-metadata lookup)'],
  [bonuses, { 'packet._id': 1, number: 1 }, 'bonuses by packet._id/number (get-packet & packet-metadata lookup)'],

  // --- qbreader: packets -------------------------------------------------
  // get-packet findOne({ 'set.name', number }); get-num-packets countDocuments({ 'set.name' });
  // get-packet-list find({ 'set.name' }).
  [packets, { 'set.name': 1, number: 1 }, 'packets by set.name/number (get-packet, get-num-packets, get-packet-list)'],
  // packet-metadata-list $match on set._id.
  [packets, { 'set._id': 1 }, 'packets by set._id (packet-metadata-list)'],

  // --- qbreader: sets ----------------------------------------------------
  // get-set-id / rename-set findOne({ name }).
  [sets, { name: 1 }, 'sets by name (get-set-id, rename-set lookups)'],

  // --- account-info: tossup-stars / bonus-stars --------------------------
  // get-ids-*, is-starred-*, star-*, unstar-*, clear-* all filter on user_id.
  [tossupStars, { user_id: 1 }, 'tossup-stars by user_id (star lookups/updates)'],
  [bonusStars, { user_id: 1 }, 'bonus-stars by user_id (star lookups/updates)'],

  // --- account-info: per-tossup-data / per-bonus-data --------------------
  // leaderboard groups on data.user_id; user-stats match documents lead with
  // data.user_id (perf report's recommended index).
  [perTossupData, { 'data.user_id': 1 }, 'per-tossup-data by data.user_id (leaderboard & user-stats)'],
  [perBonusData, { 'data.user_id': 1 }, 'per-bonus-data by data.user_id (leaderboard & user-stats)'],
  // user-stats match documents also filter on set_id.
  [perTossupData, { set_id: 1 }, 'per-tossup-data by set_id (user-stats set filter)'],
  [perBonusData, { set_id: 1 }, 'per-bonus-data by set_id (user-stats set filter)']
];

async function main () {
  for (const [collection, keys, note] of INDEXES) {
    const name = await collection.createIndex(keys);
    console.log(`ensured index ${name} on ${collection.namespace} — ${note}`);
  }
  console.log(`done: ensured ${INDEXES.length} indexes`);
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error('failed to create indexes:', error);
  process.exit(1);
}
