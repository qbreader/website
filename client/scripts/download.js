import { stringifyBonus, stringifyTossup } from './stringify.js';

export function downloadQuestionsAsText (tossups, bonuses, filename = 'data.txt') {
  let textdata = '';
  for (const tossup of tossups) {
    textdata += stringifyTossup(tossup, true) + '\n';
  }

  for (const bonus of bonuses) {
    textdata += stringifyBonus(bonus, true) + '\n';
  }

  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/text;charset=utf-8,' + encodeURIComponent(textdata);
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
}

export function downloadTossupsAsCSV (tossups, filename = 'tossups.csv') {
  const header = [
    '_id',
    'set.name',
    'packet.number',
    'number',
    'question',
    'answer',
    'answer',
    'category',
    'subcategory',
    'alternate_subcategory',
    'difficulty',
    'set._id',
    'packet._id',
    'updatedAt'
  ];

  let csvdata = header.join(',') + '\n';
  for (const tossup of tossups) {
    for (const key of header) {
      const parts = key.split('.');
      let value = tossup;
      for (const part of parts) {
        if (value === undefined) {
          break;
        } else {
          value = value[part];
        }
      }
      csvdata += escapeCSVString(value) + ',';
    }

    csvdata = csvdata.slice(0, -1);
    csvdata += '\n';
  }

  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(csvdata);
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
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

  let csvdata = header.join(',') + '\n';
  for (const bonus of bonuses) {
    for (const key of header) {
      const parts = key.split('.');
      let value = bonus;
      for (const part of parts) {
        if (value === undefined) {
          break;
        } else {
          value = value[part];
        }
      }

      csvdata += escapeCSVString(value) + ',';
    }

    csvdata = csvdata.slice(0, -1);
    csvdata += '\n';
  }

  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(csvdata);
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
}

export function downloadQuestionsAsJSON (tossups, bonuses, filename = 'data.json') {
  const JSONdata = { tossups, bonuses };
  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(JSONdata, null, 4));
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
}

function escapeCSVString (string) {
  if (string === undefined || string === null) { return ''; }

  if (typeof string !== 'string') { string = string.toString(); }

  return `"${string.replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
}
