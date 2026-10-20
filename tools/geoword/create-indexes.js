// Creates the unique indexes the Geoword team code relies on. Safe to re-run.
//
//   - a team name is unique within a set, ignoring case
//   - a join code is unique within a set (teams made before codes existed have none)
//   - a player is on at most one team per set (a unique multikey index on `members`)
//
// These make "already on a team" and "name taken" atomic, so team creation and joining need no
// check-then-write. Index creation fails if existing teams already break a rule; fix those first.
import { teams } from '../../database/geoword/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';

console.log(`Target database: "${geoword.databaseName}"`);

console.log(await teams.createIndex({ 'set._id': 1, teamName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } }));
console.log(await teams.createIndex({ 'set._id': 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $exists: true } } }));
console.log(await teams.createIndex({ 'set._id': 1, members: 1 }, { unique: true }));

await mongoClient.close();
