import { tossups, bonuses } from '../collections.js';

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const ALLOWED_TAGS = ['b', 'i', 'u'];

/**
 * Sanitizes a string to only allow <b>, <i>, <u> HTML tags.
 * @param {string} text
 * @returns {string}
 */
function sanitizeHTML (text) {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS });
}

/**
 * Strips all HTML tags from a string.
 * @param {string} text
 * @returns {string}
 */
function stripHTML (text) {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Updates a tossup's text fields by its _id.
 * @param {import('mongodb').ObjectId} _id
 * @param {object} fields
 * @param {string} [fields.question]
 * @param {string} [fields.answer]
 * @returns {Promise<import('mongodb').UpdateResult | null>}
 */
async function updateTossup (_id, { question, answer }) {
  const $set = { updatedAt: new Date() };

  if (typeof question === 'string') {
    $set.question = sanitizeHTML(question);
    $set.question_sanitized = stripHTML(question);
  }

  if (typeof answer === 'string') {
    $set.answer = sanitizeHTML(answer);
    $set.answer_sanitized = stripHTML(answer);
  }

  if (Object.keys($set).length === 1) {
    return null;
  }

  return await tossups.updateOne({ _id }, { $set });
}

/**
 * Updates a bonus's text fields by its _id.
 * @param {import('mongodb').ObjectId} _id
 * @param {object} fields
 * @param {string} [fields.leadin]
 * @param {string[]} [fields.parts]
 * @param {string[]} [fields.answers]
 * @returns {Promise<import('mongodb').UpdateResult | null>}
 */
async function updateBonus (_id, { leadin, parts, answers }) {
  const $set = { updatedAt: new Date() };

  if (typeof leadin === 'string') {
    $set.leadin = sanitizeHTML(leadin);
    $set.leadin_sanitized = stripHTML(leadin);
  }

  if (Array.isArray(parts)) {
    $set.parts = parts.map(sanitizeHTML);
    $set.parts_sanitized = parts.map(stripHTML);
  }

  if (Array.isArray(answers)) {
    $set.answers = answers.map(sanitizeHTML);
    $set.answers_sanitized = answers.map(stripHTML);
  }

  if (Object.keys($set).length === 1) {
    return null;
  }

  return await bonuses.updateOne({ _id }, { $set });
}

export { updateTossup, updateBonus };
