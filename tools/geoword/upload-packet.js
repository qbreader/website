// Uploads a Geoword packet (audio, tossups, sample clip) to whatever database MONGODB_URI points at.
//
// --mode test: a demo setup for local development. Also creates test users and teams, and
//              freely deletes and recreates the packet.
// --mode prod: a real round. Creates no users or teams, requires an explicit --cost, hides
//              the packet until published, and refuses to replace a packet anyone has used.
import { audio, buzzes, divisionChoices, packets, payments, sampleAudio, teams, tossups } from '../../database/geoword/collections.js';
import { users } from '../../database/account-info/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';
import { saltAndHashPassword } from '../../server/authentication.js';

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const DIVISION = 'open';
const MAX_DOCUMENT_SIZE = 16 * 1024 * 1024;
// The clip the "Test" button plays, so a player can check their volume before starting.
const SAMPLE_FILENAME = 'sample.mp3';

// Seeded players, so that a team's buzzes can be merged without a team-creation UI.
// These are deliberately NOT admins: recordBuzz marks an admin's buzz `active: false`,
// and leaderboards only count active buzzes, so an admin's play never shows up in
// standings. Playing as a normal user exercises the same path a real competitor will.
const TEST_USERS = [
  { username: 'soundtracks-alice', password: 'password', team: 'Tracer Bullets' },
  { username: 'soundtracks-bob', password: 'password', team: 'Tracer Bullets' },
  { username: 'soundtracks-carol', password: 'password', team: 'Solo Act' }
];

// A separate account for viewing results before the packet is finished.
const ADMIN_USER = { username: 'soundtracks-admin', password: 'password' };

const argv = yargs(hideBin(process.argv))
  .option('mode', {
    description: 'test seeds demo users and teams for local development; prod uploads a real round',
    choices: ['test', 'prod'],
    demandOption: true
  })
  .option('name', {
    alias: 'n',
    description: 'the packet name',
    type: 'string',
    demandOption: true
  })
  .option('folderPath', {
    alias: 'f',
    description: 'the folder holding the .mp3 files and answers.json',
    type: 'string',
    default: './audio/soundtracks'
  })
  .option('cost', {
    alias: 'c',
    description: 'the cost in cents (USD); 0 makes the packet free and skips Stripe. Required in prod mode, defaults to 0 in test mode',
    type: 'number'
  })
  .option('division', {
    alias: 'd',
    description: 'the division these tossups belong to',
    type: 'string',
    default: DIVISION
  })
  .option('order', {
    description: 'position in the packet list (lower is earlier)',
    type: 'number',
    default: 99
  })
  .option('hidden', {
    description: 'hide the packet from the public list, so only admins can reach it. Defaults to true in prod mode and false in test mode',
    type: 'boolean'
  })
  .option('replace', {
    description: "prod mode only: delete the packet's tossups and audio first; refused once anyone has played or paid",
    type: 'boolean',
    default: false
  })
  .option('publish', {
    description: 'only make an existing packet public, uploading nothing',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

const PROD = argv.mode === 'prod';
const PACKET_NAME = argv.name;

/**
 * Pairs each .mp3 with its question number, taken from the last number in the filename.
 * This tolerates names like `Tiebreakers - Tossup 1.mp3` as well as `01.mp3`.
 * @param {String} folderPath
 * @returns {Promise<Array<{ questionNumber: number, filename: string }>>} sorted by question number
 */
async function findAudioFiles (folderPath) {
  const filenames = (await readdir(folderPath))
    .filter(filename => filename.toLowerCase().endsWith('.mp3'))
    .filter(filename => filename.toLowerCase() !== SAMPLE_FILENAME);
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
 * @returns {Promise<string|null>} why the packet cannot be safely replaced, or null if it can
 */
async function whyNotReplaceable (packetName) {
  const counts = {
    buzzes: await buzzes.countDocuments({ 'packet.name': packetName }),
    payments: await payments.countDocuments({ 'packet.name': packetName }),
    'division choices': await divisionChoices.countDocuments({ 'packet.name': packetName })
  };
  const used = Object.entries(counts).filter(([, count]) => count > 0);
  return used.length === 0 ? null : used.map(([label, count]) => `${count} ${label}`).join(', ');
}

/**
 * Creates the seeded players if they don't exist, and returns their ids by username.
 * @returns {Promise<Object<string, ObjectId>>}
 */
async function upsertUsers () {
  const userIds = {};
  const accounts = [
    ...TEST_USERS.map(user => ({ ...user, admin: false })),
    { ...ADMIN_USER, admin: true }
  ];

  for (const { username, password, admin } of accounts) {
    await users.updateOne(
      { username },
      {
        $set: { password: saltAndHashPassword(password), admin, verifiedEmail: true },
        $setOnInsert: { username, email: `${username}@example.com` }
      },
      { upsert: true }
    );
    userIds[username] = (await users.findOne({ username }, { projection: { _id: 1 } }))._id;
  }

  return userIds;
}

console.log(`Mode: ${argv.mode}. Target database: "${geoword.databaseName}", packet "${PACKET_NAME}"`);

const costInCents = argv.cost ?? (PROD ? undefined : 0);
if (!Number.isInteger(costInCents) || costInCents < 0) {
  throw new Error(PROD ? '--cost is required in prod mode: a whole number of cents, 0 or more.' : '--cost must be a whole number of cents, 0 or more.');
}
const hidden = argv.hidden ?? PROD;

const existing = await packets.findOne({ name: PACKET_NAME });

if (argv.publish) {
  if (!existing) {
    throw new Error(`Packet "${PACKET_NAME}" does not exist.`);
  }
  await packets.updateOne({ _id: existing._id }, { $set: { test: false } });
  console.log(`"${PACKET_NAME}" is now public.`);
  await mongoClient.close();
  process.exit(0);
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

// Test mode is re-runnable: clear this packet's documents before inserting, so iterating
// doesn't duplicate. Prod mode only does so on request, and never over player data.
if (existing) {
  if (PROD) {
    if (!argv.replace) {
      throw new Error(`Packet "${PACKET_NAME}" already exists. Pass --replace to overwrite it.`);
    }
    const reason = await whyNotReplaceable(PACKET_NAME);
    if (reason) {
      throw new Error(`Refusing to replace "${PACKET_NAME}": it already has ${reason}. Replacing would orphan them.`);
    }
  }

  const oldTossups = await tossups.find({ 'packet.name': PACKET_NAME }, { projection: { audio_id: 1 } }).toArray();
  await audio.deleteMany({ _id: { $in: oldTossups.map(tossup => tossup.audio_id) } });
  await sampleAudio.deleteOne({ _id: existing.sample_audio_id });
  await tossups.deleteMany({ 'packet.name': PACKET_NAME });
  if (!PROD) {
    await teams.deleteMany({ packetName: PACKET_NAME });
  }
  await packets.deleteOne({ name: PACKET_NAME });
}

// The "Test" button plays this. Without it the button is silently a no-op, since the
// route returns an empty 200 rather than a 404. Falls back to the first tossup's audio.
const samplePath = files.some(file => file.filename.toLowerCase() === SAMPLE_FILENAME)
  ? path.join(folderPath, SAMPLE_FILENAME)
  : path.join(folderPath, files[0].filename);
const { insertedId: sampleAudioId } = await sampleAudio.insertOne({ audio: await readFile(samplePath) });

// A cost of 0 makes checkPayment pass without touching the Stripe path.
// `test: false` keeps the packet visible, so non-admin players can reach it and their
// buzzes count toward standings. `test: true` hides it from the public list instead.
const { insertedId: packetId } = await packets.insertOne({
  name: PACKET_NAME,
  costInCents,
  test: hidden,
  active: true,
  divisions: [argv.division],
  order: argv.order,
  sample_audio_id: sampleAudioId
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
    division: argv.division,
    questionNumber,
    answer,
    audio_id: audioId,
    // Unused for now; scoring is continuous celerity. Recorded for per-clip scoring later.
    ...(clipBoundaries && { clipBoundaries })
  });

  console.log(`question ${questionNumber}: ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

if (PROD) {
  console.log(`\nUploaded "${PACKET_NAME}" with ${files.length} tossups, cost ${costInCents} cents, ${hidden ? 'hidden (admins only)' : 'public'}.`);
  if (hidden) {
    console.log(`Make it public later with: node tools/geoword/upload-packet.js --mode prod -n "${PACKET_NAME}" --publish`);
  }
} else {
  const userIds = await upsertUsers();
  const teamNames = [...new Set(TEST_USERS.map(user => user.team))];

  for (const teamName of teamNames) {
    const members = TEST_USERS.filter(user => user.team === teamName).map(user => userIds[user.username]);
    // `members` is an array, so a team can be any size.
    await teams.insertOne({ packetName: PACKET_NAME, division: argv.division, teamName, members });
    console.log(`team "${teamName}": ${members.length} member(s)`);
  }

  console.log(`\nSeeded "${PACKET_NAME}" with ${files.length} tossups and ${teamNames.length} teams.`);
  console.log(`Play as ${TEST_USERS.map(user => user.username).join(' / ')} (password: "password").`);
  console.log(`View results early as ${ADMIN_USER.username} (password: "password").`);
}

await mongoClient.close();
