// Constants and functions useful for quizbowl.

function arrayToRange (array) {
  if (array.length === 0) return '';

  array = [...new Set(array)];
  array = array.sort((a, b) => a - b);

  let string = '';
  let lastRangeStart = array[0];
  let lastRangeEnd = array[0];

  for (let i = 1; i < array.length; i++) {
    if (array[i] - lastRangeEnd === 1) {
      lastRangeEnd = array[i];
    } else {
      if (lastRangeStart === lastRangeEnd) {
        string = `${string}, ${lastRangeStart}`;
      } else {
        string = `${string}, ${lastRangeStart}-${lastRangeEnd}`;
      }
      lastRangeStart = array[i];
      lastRangeEnd = array[i];
    }
  }

  if (lastRangeStart === lastRangeEnd) {
    string = `${string}, ${lastRangeStart}`;
  } else {
    string = `${string}, ${lastRangeStart}-${lastRangeEnd}`;
  }

  return string.slice(2);
}

/**
 * Return a string that represents the bonus part label for the given bonus and index.
 * For example, '[10m]' or '[10]'.
 * @param {*} bonus
 * @param {*} index
 * @param {*} defaultValue
 * @param {*} defaultDifficulty
 * @returns {String}
 */
function getBonusPartLabel (bonus, index, defaultValue = 10, defaultDifficulty = '') {
  const value = bonus.values ? (bonus.values[index] ?? defaultValue) : defaultValue;
  const difficulty = bonus.difficultyModifiers ? (bonus.difficultyModifiers[index] ?? defaultDifficulty) : defaultDifficulty;
  return `[${value}${difficulty}]`;
}

function rangeToArray (string, max = 0) {
  if (string.length === 0) {
    string = `1-${max}`;
  }

  if (string.endsWith('-')) {
    string = string + max;
  }

  const tokens = string.split(',');
  const ranges = [];
  for (let i = 0; i < tokens.length; i++) {
    const range = tokens[i].trim().split('-');
    if (range.length === 1) {
      ranges.push([parseInt(range[0]), parseInt(range[0])]);
    } else {
      ranges.push([parseInt(range[0]), parseInt(range[1])]);
    }
  }

  const array = [];
  for (let i = 0; i < ranges.length; i++) {
    for (let j = ranges[i][0]; j <= ranges[i][1]; j++) {
      array.push(j);
    }
  }

  return array;
}

export {
  arrayToRange,
  getBonusPartLabel,
  rangeToArray
};
