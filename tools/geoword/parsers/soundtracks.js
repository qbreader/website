// Converts a Soundtracks packet into the answers.json that upload-packet.js reads.
//
// Soundtracks ships two files per packet:
//   - a metadata .json: [{ "questionNumber", "prompt", "answer" }, ...], where each answer is HTML
//     ending in the question's category tag, e.g. `<b><u>Pavement</u></b> <rock>`
//   - a packet .docx, where each question has a line starting "Clues:" listing the songs played
//
// The tag becomes the tossup's category, and is removed from the answer, where the browser would
// hide it as an unknown HTML tag. There is no subcategory, since the whole tournament is music.
// The prompt becomes the tossup's instructions, and the clues its question.
import readDocxParagraphs from './read-docx-paragraphs.js';
import { escapeHTML } from '../../../shared/string-utils.js';

import { JSDOM } from 'jsdom';
import { readFile, writeFile } from 'fs/promises';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// Every tag a packet may use, by lowercase tag. An unknown tag is an error, so a typo can't
// quietly become its own category; add a line here when the tournament adds a genre.
const CATEGORIES = {
  pop: 'Pop',
  rock: 'Rock',
  'electronic/dance': 'Electronic/Dance',
  'rap/hip-hop/contemporary r&b': 'Rap/Hip-Hop/Contemporary R&B',
  'mixed/other': 'Mixed/Other'
};

const argv = yargs(hideBin(process.argv))
  .option('metadata', {
    alias: 'm',
    description: 'the packet\'s metadata .json',
    type: 'string',
    demandOption: true
  })
  .option('packet', {
    alias: 'p',
    description: 'the packet .docx, for the clues',
    type: 'string',
    demandOption: true
  })
  .option('out', {
    alias: 'o',
    description: 'where to write answers.json',
    type: 'string',
    default: './audio/soundtracks/answers.json'
  })
  .example('node tools/geoword/parsers/soundtracks.js -m "Demo Metadata.json" -p "Demo Packet.docx"')
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

const { document } = new JSDOM('').window;

/**
 * Parses the metadata file, tolerating the commas between entries being left out.
 * @param {string} text
 * @returns {Array<{ questionNumber: number, prompt: string, answer: string }>}
 */
function parseMetadata (text) {
  try {
    return JSON.parse(text);
  } catch {
    // Entries are one per line, so a missing comma is a `}` and a `{` with only a line break between.
    return JSON.parse(text.replace(/\}(\s*\n\s*)\{/g, '},$1{'));
  }
}

/**
 * Splits the trailing category tag off an answer, e.g. `<b><u>Blue</u></b> <mixed/other>`.
 * @param {string} answer
 * @param {number} questionNumber - for error messages
 * @returns {{ answer: string, category: string }}
 */
function splitCategoryTag (answer, questionNumber) {
  const match = answer.match(/\s*<([^<>]+)>\s*$/);
  // A closing tag such as `</b>` at the end means the answer has no category tag.
  if (!match || match[1].startsWith('/')) {
    throw new Error(`Question ${questionNumber}'s answer doesn't end in a category tag like <rock>: ${answer}`);
  }

  const category = CATEGORIES[match[1].trim().toLowerCase()];
  if (!category) {
    throw new Error(`Question ${questionNumber} has an unknown category tag <${match[1]}>. Known tags: ${Object.keys(CATEGORIES).join(', ')}.`);
  }

  return { answer: answer.slice(0, match.index), category };
}

/**
 * Runs HTML through a browser parser, which repairs misnested tags like `<b><u>x</b></u>`.
 * @param {string} html
 * @returns {{ html: string, text: string }}
 */
function normalizeHTML (html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return { html: div.innerHTML, text: div.textContent };
}

/**
 * @param {string[]} paragraphs - the packet's text
 * @returns {Object<number, string>} each question's clue list, by question number
 */
function findClues (paragraphs) {
  const clues = {};
  let questionNumber;

  for (const paragraph of paragraphs) {
    const heading = paragraph.match(/^(\d+)\.\s/);
    if (heading) {
      questionNumber = parseInt(heading[1]);
      continue;
    }

    const clueLine = paragraph.match(/^Clues:\s*(.*)$/);
    if (clueLine && questionNumber !== undefined) {
      clues[questionNumber] = clueLine[1];
    }
  }

  return clues;
}

const metadata = parseMetadata(await readFile(argv.metadata, 'utf-8'));
const clues = findClues(await readDocxParagraphs(argv.packet));

const answers = metadata.map(({ questionNumber, prompt, answer: taggedAnswer }) => {
  if (!clues[questionNumber]) {
    throw new Error(`The packet has no "Clues:" line for question ${questionNumber}.`);
  }

  const { answer, category } = splitCategoryTag(taggedAnswer, questionNumber);
  const { html, text } = normalizeHTML(answer.trim());

  return {
    questionNumber,
    question: escapeHTML(clues[questionNumber]),
    question_sanitized: clues[questionNumber],
    category,
    answer: html,
    answer_sanitized: text,
    instructions: prompt.trim()
  };
});

await writeFile(argv.out, JSON.stringify(answers, null, 2) + '\n');

for (const { questionNumber, category, answer_sanitized: answerSanitized } of answers) {
  console.log(`question ${questionNumber}: <${category}> ${answerSanitized}`);
}
console.log(`\nWrote ${answers.length} questions to ${argv.out}.`);
