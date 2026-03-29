import 'dotenv/config';

import { stringifyBonus, stringifyTossup } from '../../client/scripts/stringify.js';
import getReports from '../../database/qbreader/admin/get-reports.js';

import Anthropic from '@anthropic-ai/sdk';
import { ALTERNATE_SUBCATEGORY_TO_CATEGORY, CATEGORY_TO_ALTERNATE_SUBCATEGORIES, SUBCATEGORIES, SUBCATEGORY_TO_CATEGORY } from '../../quizbowl/categories.js';

const anthropic = new Anthropic();
const model = 'claude-haiku-4-5-20251001';

/**
 *
 * @param {string[]} texts
 * @param {string[]} options
 * @returns {Promise<string[]>}
 */
async function classifyFromOptions (texts, options) {
  const maxTokens = Math.min(32 * texts.length, 4096);

  const messages = [
    `Classify the following questions into one of the following categories: ${options.join(', ')}. Each response should consist of one of the categories and nothing else. There should be one response per question, separated by a comma.`,
    ...texts
  ].map(content => ({ role: 'user', content }));

  const message = await anthropic.messages.create({ model, max_tokens: maxTokens, messages });
  console.log(message);
  return message.content[0].text.split(', ')
    .filter(line => line.trim() !== '')
    .map(line => options.includes(line) ? line : null);
}

/**
 *
 * @param {{ _id: ObjectId, text: string }} questions
 */
async function classify (questions) {
  const subcategorys = await classifyFromOptions(questions.map(q => q.text), SUBCATEGORIES);
  questions = questions.map((q, i) => ({ ...q, subcategory: subcategorys[i] }));
  questions = questions.map(q => ({ ...q, category: SUBCATEGORY_TO_CATEGORY[q.subcategory] }));

  for (const category of Object.keys(CATEGORY_TO_ALTERNATE_SUBCATEGORIES)) {
    const alternateSubcategories = CATEGORY_TO_ALTERNATE_SUBCATEGORIES[category];
    if (alternateSubcategories.length === 0) { continue; }

    const filteredQuestions = questions.filter(q => category.includes(q.category));
    if (filteredQuestions.length === 0) { continue; }

    const classifiedCategories = await classifyFromOptions(filteredQuestions.map(q => q.text), alternateSubcategories);

    for (let i = 0; i < filteredQuestions.length; i++) {
      filteredQuestions[i].alternate_subcategory = classifiedCategories[i];
      for (const question of questions) {
        if (question._id.equals(filteredQuestions[i]._id)) {
          question.alternate_subcategory = classifiedCategories[i];
        }
      }
    }
  }

  return questions;
}

/**
 *
 * @param {"wrong-category" | "text-error"} reason
 * @param {number} limit
 */
async function classifyReports (reason, limit = 20) {
  const reports = await getReports(reason);
  reports.tossups = reports.tossups.slice(0, limit);
  reports.bonuses = reports.bonuses.slice(0, limit);
  reports.tossups = reports.tossups.map(tossup => ({ _id: tossup._id, text: stringifyTossup(tossup, false) }));
  reports.bonuses = reports.bonuses.map(bonus => ({ _id: bonus._id, text: stringifyBonus(bonus, false) }));

  const classifiedTossups = await classify(reports.tossups);
  console.log(classifiedTossups);
}

console.log(await classifyReports('wrong-category'));
