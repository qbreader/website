// Uploads a Geoword packet (audio, tossups, sample clip) to whatever database MONGODB_URI points at.
//
// --mode test: a demo setup for local development. Also creates test users and teams, and
//              freely deletes and recreates the packet.
// --mode prod: a real round. Creates no teams or players (just a special user), requires an explicit --cost (unless the packet exists, whose cost is
//              kept), hides the packet until published, and refuses to replace a packet anyone has used.
// --upsert:    in either mode, updates an existing packet's tossups in place instead, which is safe
//              even after people have played it. Creates the packet if it doesn't exist yet.
import { audio, buzzes, divisionChoices, packets, payments, sampleAudio, sets, teams, tossups } from '../../database/geoword/collections.js';
import { users } from '../../database/account-info/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';
import { saltAndHashPassword } from '../../server/authentication.js';
import getRandomName from '../../shared/get-random-name.js';
import { DEFAULT_SCORING_SCHEME, SCORING_SCHEMES } from '../../shared/geoword-scoring.js';
import getMp3Duration from './get-mp3-duration.js';

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { isDeepStrictEqual } from 'util';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const DIVISION = 'open';
const MAX_DOCUMENT_SIZE = 16 * 1024 * 1024;
// The clip the "Test" button plays, so a player can check their volume before starting.
const SAMPLE_FILENAME = 'sample.mp3';
// Copied from each answers.json entry onto its tossup. Prod mode requires all of them;
// test mode takes whichever are present, so a bare `{ questionNumber, answer }` still seeds.
const TOSSUP_TEXT_FIELDS = ['question', 'question_sanitized', 'category', 'subcategory', 'answer_sanitized', 'answer'];
const OPTIONAL_TOSSUP_FIELDS = ['instructions', 'clues'];
// Everything --upsert keeps in sync with answers.json. Audio is deliberately not here.
const UPSERTED_TOSSUP_FIELDS = [...TOSSUP_TEXT_FIELDS, ...OPTIONAL_TOSSUP_FIELDS, 'clipBoundaries'];

// Seeded players, so that a team's buzzes can be merged without a team-creation UI.
// These are deliberately NOT admins: recordBuzz marks an admin's buzz `active: false`,
// and leaderboards only count active buzzes, so an admin's play never shows up in
// standings. Playing as a normal user exercises the same path a real competitor will.
const TEST_USERS = [
  { username: 'soundtracks-alice', password: 'password', team: 'Tracer Bullets' },
  { username: 'soundtracks-bob', password: 'password', team: 'Tracer Bullets' },
  { username: 'soundtracks-carol', password: 'password', team: 'Solo Act' }
];

/**
 * @returns {string} four random words joined by dashes, e.g. `brave-otter-vivid-falcon`
 */
function generatePassphrase () {
  return `${getRandomName()}-${getRandomName()}`;
}

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
  .option('set', {
    description: 'the name of the set this packet belongs to, e.g. september; created if it does not exist yet. An existing packet must already be in this set',
    type: 'string',
    demandOption: true
  })
  .option('teams', {
    description: 'open (--teams) or close (--no-teams) team registration for the set. Left as is if omitted, except that test mode opens it',
    type: 'boolean'
  })
  .option('folderPath', {
    alias: 'f',
    description: 'the folder holding the .mp3 files and answers.json',
    type: 'string',
    default: './audio/soundtracks'
  })
  .option('cost', {
    alias: 'c',
    description: 'the cost in cents (USD); 0 makes the packet free and skips Stripe. Required in prod mode when creating a packet; --replace and --upsert keep the existing packet\'s cost if omitted. Defaults to 0 in test mode',
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
  .option('scoring', {
    description: 'how buzzes are scored: celerity is 10-20 points for a correct answer, neg5 is +10 / -5 (0 once the audio has ended)',
    choices: Object.keys(SCORING_SCHEMES),
    default: DEFAULT_SCORING_SCHEME
  })
  .option('replace', {
    description: "prod mode only: delete the packet's tossups and audio first; refused once anyone has played or paid",
    type: 'boolean',
    default: false
  })
  .option('upsert', {
    description: "create the packet, or if it exists, update its tossups' text fields from answers.json in place, keeping their audio, ids (so buzzes stay attached), and the packet's settings. Allowed once anyone has played",
    type: 'boolean',
    default: false
  })
  // Not .conflicts(): yargs counts a boolean's default `false` as set, so it would always trip.
  .check(argv => {
    const combined = ['replace', 'publish', 'sampleOnly'].filter(option => argv[option]);
    if (argv.upsert && combined.length > 0) {
      throw new Error(`--upsert cannot be combined with --${combined.join(', --')}.`);
    }
    return true;
  })
  .option('publish', {
    description: 'only make an existing packet public, uploading nothing',
    type: 'boolean',
    default: false
  })
  .option('sampleOnly', {
    description: "only replace an existing packet's sample clip with sample.mp3 from --folderPath, uploading nothing else",
    type: 'boolean',
    default: false
  })
  .epilog(`Folder layout (--folderPath):
  audio/soundtracks/
  ├── answers.json     [{ "questionNumber": 1, "question": "...", "category": "...",
  │                      "subcategory": "...", "answer": "...", "answer_sanitized": "..." }, ...]
  │                    prod requires all of those; test mode only needs questionNumber and answer
  │                    optional: "instructions" (shown above the question while it plays)
  │                    optional: "clues", e.g. ["\\"Vienna\\"", ...], and "clipBoundaries", the second each
  │                      clue starts at, e.g. [0, 10, 21, ...]; the results page lists the clues to jump to
  ├── sample.mp3       optional: the clip the "Test" button plays (else the first tossup's audio)
  ├── 01.mp3           one per tossup; the last number in the filename is the question number,
  ├── 02.mp3           so "Tiebreakers - Tossup 1.mp3" is question 1
  └── ...              every .mp3 needs an answers.json entry, and each file must be under 16 MB

Examples:
  node tools/geoword/upload-packet.js --mode test -n soundtracks --set september
      Seed a local demo: free, public, with test users and teams
  node tools/geoword/upload-packet.js --mode prod -n soundtracks --set september --teams -c 500
      Upload a real round for $5.00, hidden from players, and open team registration for its set
  node tools/geoword/upload-packet.js --mode prod -n soundtracks --publish
      Make the uploaded real round public
  node tools/geoword/upload-packet.js --mode prod -n soundtracks --set september -c 500 --replace
      Re-upload a real round nobody has played or paid for yet
  node tools/geoword/upload-packet.js --mode prod -n soundtracks -c 500 --upsert
      Apply answers.json edits (answers, categories, ...) to a real round, even one players have used
  node tools/geoword/upload-packet.js --mode prod -n soundtracks --sample-only
      Swap just the sample clip, even on a round players have used

Modes:
                          test                      prod
  Test users and teams    created                   never created
  Special user password   "password"                random passphrase, printed
  --cost                  optional (defaults to 0)  required for a new packet; else kept
  Visibility              public by default         hidden by default
  Packet already exists   deleted and recreated     refused unless --replace or --upsert
  --replace               not needed                refused if packet is used
  --upsert                updates tossups in place  updates tossups in place

Override visibility in either mode with --hidden or --no-hidden.
This writes to whatever MONGODB_URI points at.`)
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

const PROD = argv.mode === 'prod';
const PACKET_NAME = argv.name;

// A separate account for viewing the packet before it is published. It is NOT a site admin:
// the packet's set lists it in `specialUsers`, which grants access to the packets in that set only.
const ADMIN_USERNAME = PROD ? 'soundtracks-admin-prod' : 'soundtracks-admin';

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
 * Creates the given accounts if they don't exist (resetting their passwords if they do),
 * and returns their ids by username.
 * @param {Array<{ username: string, password: string }>} accounts
 * @returns {Promise<Object<string, ObjectId>>}
 */
async function upsertUsers (accounts) {
  const userIds = {};

  for (const { username, password } of accounts) {
    await users.updateOne(
      { username },
      {
        $set: { password: saltAndHashPassword(password), verifiedEmail: true },
        $setOnInsert: { username, email: `${username}@example.com` }
      },
      { upsert: true }
    );
    userIds[username] = (await users.findOne({ username }, { projection: { _id: 1 } }))._id;
  }

  return userIds;
}

/**
 * Uploads one question's audio and inserts its tossup.
 * @param {ObjectId} packetId
 * @param {{ questionNumber: number, filename: string }} file
 * @param {Object} entry - the question's answers.json entry
 */
async function insertTossup (packetId, { questionNumber, filename }, entry) {
  const buffer = await readFile(path.join(argv.folderPath, filename));

  if (buffer.length >= MAX_DOCUMENT_SIZE) {
    throw new Error(`"${filename}" is ${(buffer.length / 1024 / 1024).toFixed(1)} MB, over MongoDB's 16 MB document limit.`);
  }

  const duration = getMp3Duration(buffer);
  const { insertedId: audioId } = await audio.insertOne({ audio: buffer });
  const { clipBoundaries } = entry;

  await tossups.insertOne({
    packet: { _id: packetId, name: PACKET_NAME },
    set: SET,
    division: argv.division,
    questionNumber,
    ...Object.fromEntries([...TOSSUP_TEXT_FIELDS, ...OPTIONAL_TOSSUP_FIELDS].filter(field => entry[field] !== undefined).map(field => [field, entry[field]])),
    audio_id: audioId,
    // The results Packet page uses these to jump between clues. Scoring is continuous celerity,
    // so they could also serve per-clip scoring later.
    ...(clipBoundaries && { clipBoundaries }),
    duration
  });

  console.log(`question ${questionNumber}: ${filename} (${(buffer.length / 1024).toFixed(0)} KB, ${duration.toFixed(1)}s)`);
}

/**
 * Brings an existing packet's tossups in line with answers.json without deleting anything.
 * Each tossup is updated in place, so its _id (which buzzes point at) and audio are kept;
 * a field missing from its entry is removed. A question with no tossup yet is inserted.
 * Tossups with no audio file in the folder are reported, not deleted.
 * @param {ObjectId} packetId
 * @param {Array<{ questionNumber: number, filename: string }>} files
 * @param {Object<number, Object>} answersByNumber
 */
async function upsertTossups (packetId, files, answersByNumber) {
  for (const file of files) {
    const { questionNumber } = file;
    const entry = answersByNumber[questionNumber];
    const tossup = await tossups.findOne({ 'packet.name': PACKET_NAME, division: argv.division, questionNumber });

    if (!tossup) {
      await insertTossup(packetId, file, entry);
      continue;
    }

    const $set = {};
    const $unset = {};
    for (const field of UPSERTED_TOSSUP_FIELDS) {
      if (entry[field] === undefined) {
        if (tossup[field] !== undefined) { $unset[field] = ''; }
      } else if (!isDeepStrictEqual(entry[field], tossup[field])) {
        $set[field] = entry[field];
      }
    }

    const changed = [...Object.keys($set), ...Object.keys($unset)];
    if (changed.length === 0) {
      console.log(`question ${questionNumber}: unchanged`);
      continue;
    }

    await tossups.updateOne({ _id: tossup._id }, {
      ...(Object.keys($set).length > 0 && { $set }),
      ...(Object.keys($unset).length > 0 && { $unset })
    });
    console.log(`question ${questionNumber}: updated ${changed.join(', ')}`);
  }

  const strays = await tossups.find(
    { 'packet.name': PACKET_NAME, division: argv.division, questionNumber: { $nin: files.map(file => file.questionNumber) } },
    { projection: { questionNumber: 1 } }
  ).toArray();
  for (const { questionNumber } of strays) {
    console.warn(`question ${questionNumber}: in the database but has no audio file here; left as is.`);
  }
}

console.log(`Mode: ${argv.mode}. Target database: "${geoword.databaseName}", packet "${PACKET_NAME}"`);

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

if (argv.sampleOnly) {
  if (!existing) {
    throw new Error(`Packet "${PACKET_NAME}" does not exist.`);
  }
  const sampleFilename = (await readdir(folderPath)).find(filename => filename.toLowerCase() === SAMPLE_FILENAME);
  if (!sampleFilename) {
    throw new Error(`No ${SAMPLE_FILENAME} in ${folderPath}.`);
  }
  const { insertedId: sampleAudioId } = await sampleAudio.insertOne({ audio: await readFile(path.join(folderPath, sampleFilename)) });
  await packets.updateOne({ _id: existing._id }, { $set: { sample_audio_id: sampleAudioId } });
  await sampleAudio.deleteOne({ _id: existing.sample_audio_id });
  console.log(`Replaced the sample clip of "${PACKET_NAME}".`);
  await mongoClient.close();
  process.exit(0);
}

let costInCents = argv.cost;
if (costInCents === undefined) {
  if (!PROD) {
    costInCents = 0;
  } else if (existing) {
    // --replace and --upsert on an existing prod packet can leave --cost off and keep the one it has.
    costInCents = existing.costInCents;
    console.log(`No --cost given; keeping "${PACKET_NAME}"'s existing cost of ${costInCents} cents.`);
  }
}
if (!Number.isInteger(costInCents) || costInCents < 0) {
  throw new Error(PROD ? '--cost is required in prod mode when creating a packet: a whole number of cents, 0 or more.' : '--cost must be a whole number of cents, 0 or more.');
}

/**
 * @param {String} setName
 * @returns {Promise<{ _id: ObjectId, name: string }>}
 */
async function getOrCreateSet (setName) {
  const teamsEnabled = argv.teams ?? (PROD ? undefined : true);
  const update = { $setOnInsert: { name: setName }, ...(teamsEnabled !== undefined && { $set: { 'teams.enabled': teamsEnabled } }) };
  const set = await sets.findOneAndUpdate({ name: setName }, update, { upsert: true, returnDocument: 'after' });
  return { _id: set._id, name: set.name };
}

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
  if (PROD) {
    const missing = TOSSUP_TEXT_FIELDS.filter(field => typeof answersByNumber[questionNumber][field] !== 'string' || answersByNumber[questionNumber][field] === '');
    if (missing.length > 0) {
      throw new Error(`answers.json entry for question ${questionNumber} is missing: ${missing.join(', ')}.`);
    }
  }
}

const SET = await getOrCreateSet(argv.set);
if (argv.upsert && existing && String(existing.set?._id) !== String(SET._id)) {
  throw new Error(`Packet "${PACKET_NAME}" is not in set "${SET.name}" (its set is ${existing.set ? `"${existing.set.name}"` : 'unset'}).`);
}

if (argv.upsert && existing) {
  await upsertTossups(existing._id, files, answersByNumber);
  console.log(`
Upserted "${PACKET_NAME}" (${argv.division}). Audio and packet settings were left unchanged.`);
  await mongoClient.close();
  process.exit(0);
}

// Test mode is re-runnable: clear this packet's documents before inserting, so iterating
// doesn't duplicate. Prod mode only does so on request, and never over player data.
if (existing) {
  if (PROD) {
    if (!argv.replace) {
      throw new Error(`Packet "${PACKET_NAME}" already exists. Pass --replace to overwrite it, or --upsert to update it in place.`);
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
  await packets.deleteOne({ name: PACKET_NAME });
}

// The "Test" button plays this. Without it the button is silently a no-op, since the
// route returns an empty 200 rather than a 404. Falls back to the first tossup's audio.
const sampleFilename = (await readdir(folderPath)).find(filename => filename.toLowerCase() === SAMPLE_FILENAME);
const samplePath = path.join(folderPath, sampleFilename ?? files[0].filename);
const { insertedId: sampleAudioId } = await sampleAudio.insertOne({ audio: await readFile(samplePath) });

// Create the accounts before the packet, whose set lists the special user by id.
const adminPassword = PROD ? generatePassphrase() : 'password';
const accounts = [
  ...(PROD ? [] : TEST_USERS.map(({ username, password }) => ({ username, password }))),
  { username: ADMIN_USERNAME, password: adminPassword }
];
const userIds = await upsertUsers(accounts);

// A cost of 0 makes checkPayment pass without touching the Stripe path.
// `test: false` keeps the packet visible, so non-admin players can reach it and their
// buzzes count toward standings. `test: true` hides it from the public list instead.
await sets.updateOne({ _id: SET._id }, { $addToSet: { specialUsers: userIds[ADMIN_USERNAME] } });

const { insertedId: packetId } = await packets.insertOne({
  name: PACKET_NAME,
  set: SET,
  costInCents,
  test: hidden,
  active: true,
  divisions: [argv.division],
  order: argv.order,
  scoring: argv.scoring,
  sample_audio_id: sampleAudioId
});

for (const file of files) {
  await insertTossup(packetId, file, answersByNumber[file.questionNumber]);
}

if (PROD) {
  console.log(`\nUploaded "${PACKET_NAME}" with ${files.length} tossups, cost ${costInCents} cents, ${hidden ? 'hidden (admins only)' : 'public'}.`);
  if (hidden) {
    console.log(`Make it public later with: node tools/geoword/upload-packet.js --mode prod -n "${PACKET_NAME}" --publish`);
  }

  // The password is reset on every run.
  console.log(`\nSpecial user (can view this packet while hidden; not a site admin): ${ADMIN_USERNAME} (password: "${adminPassword}").`);
} else {
  const teamNames = [...new Set(TEST_USERS.map(user => user.team))];

  await teams.deleteMany({ 'set._id': SET._id, teamName: { $in: teamNames } });

  for (const teamName of teamNames) {
    const members = TEST_USERS.filter(user => user.team === teamName).map(user => userIds[user.username]);
    // `members` is an array, so a team can be any size.
    await teams.insertOne({ set: SET, teamName, members });
    console.log(`team "${teamName}": ${members.length} member(s)`);
  }

  console.log(`\nSeeded "${PACKET_NAME}" with ${files.length} tossups and ${teamNames.length} teams.`);
  console.log(`Play as ${TEST_USERS.map(user => user.username).join(' / ')} (password: "password").`);
  console.log(`View the packet early as ${ADMIN_USERNAME} (password: "password").`);
}

await mongoClient.close();
