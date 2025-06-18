import insertTokensIntoHTML from '../../quizbowl/insert-tokens-into-html.js';

export function highlightTossupQuery ({ tossup, regExp, searchType = 'all', ignoreWordOrder, queryString }) {
  const words = ignoreWordOrder
    ? queryString.split(' ').filter(word => word !== '').map(word => new RegExp(word, 'ig'))
    : [regExp];

  for (const word of words) {
    if (searchType === 'question' || searchType === 'all') {
      tossup.question = insertHighlightTokensHelper(tossup.question, tossup.question_sanitized, word);
    }

    if (searchType === 'answer' || searchType === 'all') {
      tossup.answer = insertHighlightTokensHelper(tossup.answer, tossup.answer_sanitized, word);
    }
  }

  return tossup;
}

export function highlightBonusQuery ({ bonus, regExp, searchType = 'all', ignoreWordOrder, queryString }) {
  const words = ignoreWordOrder
    ? queryString.split(' ').filter(word => word !== '').map(word => new RegExp(word, 'ig'))
    : [regExp];

  for (const word of words) {
    if (searchType === 'question' || searchType === 'all') {
      bonus.leadin = insertHighlightTokensHelper(bonus.leadin, bonus.leadin_sanitized, word);
      for (let i = 0; i < bonus.parts.length; i++) {
        bonus.parts[i] = insertHighlightTokensHelper(bonus.parts[i], bonus.parts_sanitized[i], word);
      }
    }

    if (searchType === 'answer' || searchType === 'all') {
      for (let i = 0; i < bonus.answers.length; i++) {
        bonus.answers[i] = insertHighlightTokensHelper(bonus.answers[i], bonus.answers_sanitized[i], word);
      }
    }
  }

  return bonus;
}

/**
 * Finds all matches of a regular expression in a given string and returns the start and end indices of each match.
 *
 * @param {string} clean - The string to search for matches.
 * @param {RegExp} regex - The regular expression to match against the string. Should have the global flag set.
 * @returns {{ starts: number[], ends: number[] }} An object containing arrays of start and end indices for each match.
 */
function getMatchIndices (clean, regex) {
  const iterator = clean.matchAll(regex);
  const starts = [];
  const ends = [];

  let data = iterator.next();
  while (data.done === false) {
    starts.push(data.value.index);
    ends.push(data.value.index + data.value[0].length);
    data = iterator.next();
  }
  return { starts, ends };
}

function insertHighlightTokensHelper (dirty, clean, word) {
  const { starts, ends } = getMatchIndices(clean, word);
  return insertTokensIntoHTML(
    dirty,
    clean,
    { '<span class="text-highlight">': starts, '</span>': ends },
    '<span class="text-highlight">'
  );
}
