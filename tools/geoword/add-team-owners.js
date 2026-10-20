// Makes the first member of every team without an owner its owner. Teams created through the site
// have one from the start; this covers older teams, such as the ones seeded before ownership existed.
// Safe to re-run.
import { teams } from '../../database/geoword/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';

console.log(`Target database: "${geoword.databaseName}"`);

const { modifiedCount } = await teams.updateMany(
  { owner: { $exists: false }, 'members.0': { $exists: true } },
  [{ $set: { owner: { $first: '$members' } } }]
);

console.log(`Gave ${modifiedCount} team(s) an owner.`);

await mongoClient.close();
