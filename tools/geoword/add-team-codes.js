// Gives every team that has no join code one. Teams created through the site get theirs at creation;
// this covers older teams, such as the ones seeded before join codes existed. Safe to re-run.
import { teams } from '../../database/geoword/collections.js';
import generateTeamCode from '../../database/geoword/generate-team-code.js';
import { geoword, mongoClient } from '../../database/databases.js';

console.log(`Target database: "${geoword.databaseName}"`);

let added = 0;
for await (const team of teams.find({ code: { $exists: false } })) {
  // Retried on the (astronomically unlikely) collision with a code in the same set, which needs
  // the unique index from create-indexes.js to be detected.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await teams.updateOne({ _id: team._id }, { $set: { code: generateTeamCode() } });
      added++;
      break;
    } catch (error) {
      if (error.code !== 11000) { throw error; }
    }
  }
}

console.log(`Added codes to ${added} team(s).`);

await mongoClient.close();
