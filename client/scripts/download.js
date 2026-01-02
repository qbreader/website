import { stringifyBonus, stringifyTossup } from './stringify.js';

/**
 * Downloads data as a file by creating a temporary anchor element and triggering a download.
 * Supports CSV, JSON, and TXT file formats.
 *
 * @param {string} filename - The name of the file to be downloaded, including extension (csv, json, or txt)
 * @param {string} data - The content to be downloaded as a file
 * @returns {void}
 *
 * @example
 * downloadAsFile('data.json', JSON.stringify({key: 'value'}));
 * downloadAsFile('report.csv', 'name,age\nJohn,30');
 */
export function downloadAsFile (filename, data) {
  const filetype = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    csv: 'text/csv',
    json: 'application/json',
    txt: 'text/plain'
  };

  const mimeType = mimeTypes[filetype];
  const hiddenElement = document.createElement('a');
  hiddenElement.href = `data:${mimeType};charset=utf-8,` + encodeURIComponent(data);
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
}

export function downloadQuestionsAsText (tossups, bonuses, filename = 'data.txt') {
  let textdata = '';
  for (const tossup of tossups) { textdata += stringifyTossup(tossup, true) + '\n'; }
  for (const bonus of bonuses) { textdata += stringifyBonus(bonus, true) + '\n'; }
  downloadAsFile(filename, textdata);
}

function convertQuestionsToCSV (header, questions) {
  function extractEmbeddedField (object, field) {
    const parts = field.split('.');
    let value = object;
    for (const part of parts) {
      if (value === undefined) { break; }
      value = value[part];
    }
    return value;
  }

  function escapeCSVString (string) {
    if (string === undefined || string === null) { return ''; }
    if (typeof string !== 'string') { string = string.toString(); }
    return `"${string.replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
  }

  let csvdata = header.join(',') + '\n';
  for (const question of questions) {
    csvdata += header
      .map(key => extractEmbeddedField(question, key))
      .map(escapeCSVString)
      .join(',') + '\n';
  }
  return csvdata;
}

export function downloadTossupsAsCSV (tossups, filename = 'tossups.csv') {
  const header = [
    '_id',
    'set.name',
    'packet.number',
    'number',
    'question',
    'answer_sanitized',
    'answer',
    'category',
    'subcategory',
    'alternate_subcategory',
    'difficulty',
    'set._id',
    'packet._id',
    'updatedAt'
  ];

  const csvdata = convertQuestionsToCSV(header, tossups);
  downloadAsFile(filename, csvdata);
}

export function downloadBonusesAsCSV (bonuses, filename = 'bonuses.csv') {
  const header = [
    '_id',
    'set.name',
    'packet.number',
    'number',
    'leadin',
    'parts.0',
    'parts.1',
    'parts.2',
    'answers_sanitized.0',
    'answers_sanitized.1',
    'answers_sanitized.2',
    'answers.0',
    'answers.1',
    'answers.2',
    'category',
    'subcategory',
    'alternate_subcategory',
    'difficulty',
    'set._id',
    'packet._id',
    'updatedAt'
  ];

  const csvdata = convertQuestionsToCSV(header, bonuses);
  downloadAsFile(filename, csvdata);
}

export function downloadQuestionsAsJSON (tossups, bonuses, filename = 'data.json') {
  downloadAsFile(filename, JSON.stringify({ tossups, bonuses }, null, 4));
}
