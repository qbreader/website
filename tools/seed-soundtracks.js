// Seeds the "soundtracks" demo packet: audio, tossups, test users, and teams.
// Local development only - this writes to whatever database MONGODB_URI points at.
import { audio, packets, teams, tossups } from '../database/geoword/collections.js';
import { users } from '../database/account-info/collections.js';
import { mongoClient } from '../database/databases.js';
import { saltAndHashPassword } from '../server/authentication.js';

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const PACKET_NAME = 'soundtracks';
const DIVISION = 'open';
const MAX_DOCUMENT_SIZE = 16 * 1024 * 1024;

// Seeded players, so that a team's buzzes can be merged without a team-creation UI.
const TEST_USERS = [
  { username: 'soundtracks-alice', password: 'password', team: 'Tracer Bullets' },
  { username: 'soundtracks-bob', password: 'password', team: 'Tracer Bullets' },
  { username: 'soundtracks-carol', password: 'password', team: 'Solo Act' }
];

const argv = yargs(hideBin(process.argv))
  .option('folderPath', {
    alias: 'f',
    description: 'the folder holding the .mp3 files and answers.json',
    type: 'string',
    default: './audio/soundtracks'
  })
  .option('admin', {
    description: 'whether the seeded users are admins, so they can reach a test packet',
    type: 'boolean',
    default: true
  })
  .help()
  .alias('help', 'h')
  .argv;

/**
 * Pairs each .mp3 with its question number, taken from the last number in the filename.
 * This tolerates names like `Tiebreakers - Tossup 1.mp3` as well as `01.mp3`.
 * @param {String} folderPath
 * @returns {Promise<Array<{ questionNumber: number, filename: string }>>} sorted by question number
 */
async function findAudioFiles (folderPath) {
  const filenames = (await readdir(folderPath)).filter(filename => filename.toLowerCase().endsWith('.mp3'));
  const files = [];

  for (const filename of filenames) {
    const matches = path.basename(filename, path.extname(filename)).match(/(\d+)/g);
    if (!matches) {
      throw new Error(`Cannot tell which question "${filename}" is: no number in the filename.`);
    }
    files.push({ questionNumber: parseInt(matches[matches.length - 1]), filename });
  }

  files.sort((a, b) => a.questionNumber - b.questionNumber);

  const duplicate = files.find((file, index) => index > 0 && files[index - 1].questionNumber === file.questionNumber);
  if (duplicate) {
    throw new Error(`Two audio files both claim to be question ${duplicate.questionNumber}.`);
  }

  return files;
}

/**
 * Creates the seeded players if they don't exist, and returns their ids by username.
 * @returns {Promise<Object<string, ObjectId>>}
 */
async function upsertUsers () {
  const userIds = {};

  for (const { username, password } of TEST_USERS) {
    await users.updateOne(
      { username },
      {
        $set: { password: saltAndHashPassword(password), admin: argv.admin, verifiedEmail: true },
        $setOnInsert: { username, email: `${username}@example.com` }
      },
      { upsert: true }
    );
    userIds[username] = (await users.findOne({ username }, { projection: { _id: 1 } }))._id;
  }

  return userIds;
}

const folderPath = argv.folderPath;
const files = await findAudioFiles(folderPath);

if (files.length === 0) {
  throw new Error(`No .mp3 files in ${folderPath}. Put the audio there and try again.`);
}

const answers = JSON.parse(await readFile(path.join(folderPath, 'answers.json'), 'utf-8'));
const answersByNumber = Object.fromEntries(answers.map(answer => [answer.questionNumber, answer]));

for (const { questionNumber, filename } of files) {
  if (!answersByNumber[questionNumber]) {
    throw new Error(`"${filename}" is question ${questionNumber}, but answers.json has no entry for it.`);
  }
}

// Re-runnable: clear this packet's documents before inserting, so iterating doesn't duplicate.
const existing = await packets.findOne({ name: PACKET_NAME });
if (existing) {
  const oldTossups = await tossups.find({ 'packet.name': PACKET_NAME }, { projection: { audio_id: 1 } }).toArray();
  await audio.deleteMany({ _id: { $in: oldTossups.map(tossup => tossup.audio_id) } });
  await tossups.deleteMany({ 'packet.name': PACKET_NAME });
  await teams.deleteMany({ packetName: PACKET_NAME });
  await packets.deleteOne({ name: PACKET_NAME });
}

// `costInCents: 0` makes checkPayment pass without touching the Stripe path.
// `test: true` keeps the packet off the public list, so only admins can reach it.
const { insertedId: packetId } = await packets.insertOne({
  name: PACKET_NAME,
  costInCents: 0,
  test: true,
  active: true,
  divisions: [DIVISION],
  order: 99
});

for (const { questionNumber, filename } of files) {
  const buffer = await readFile(path.join(folderPath, filename));

  if (buffer.length >= MAX_DOCUMENT_SIZE) {
    throw new Error(`"${filename}" is ${(buffer.length / 1024 / 1024).toFixed(1)} MB, over MongoDB's 16 MB document limit.`);
  }

  const { insertedId: audioId } = await audio.insertOne({ audio: buffer });
  const { answer, clipBoundaries } = answersByNumber[questionNumber];

  await tossups.insertOne({
    packet: { _id: packetId, name: PACKET_NAME },
    division: DIVISION,
    questionNumber,
    answer,
    audio_id: audioId,
    // Unused for now; scoring is continuous celerity. Recorded for per-clip scoring later.
    ...(clipBoundaries && { clipBoundaries })
  });

  console.log(`question ${questionNumber}: ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

const userIds = await upsertUsers();
const teamNames = [...new Set(TEST_USERS.map(user => user.team))];

for (const teamName of teamNames) {
  const members = TEST_USERS.filter(user => user.team === teamName).map(user => userIds[user.username]);
  // `members` is an array, so a team can be any size.
  await teams.insertOne({ packetName: PACKET_NAME, division: DIVISION, teamName, members });
  console.log(`team "${teamName}": ${members.length} member(s)`);
}

console.log(`\nSeeded "${PACKET_NAME}" with ${files.length} tossups and ${teamNames.length} teams.`);
console.log(`Log in as ${TEST_USERS.map(user => user.username).join(' / ')} (password: "password").`);

await mongoClient.close();
