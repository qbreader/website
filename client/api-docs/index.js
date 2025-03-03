import { DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR } from '../../quizbowl/constants.js';

document.querySelectorAll('span.default-min-year').forEach(element => {
  element.textContent = DEFAULT_MIN_YEAR;
});

document.querySelectorAll('span.default-max-year').forEach(element => {
  element.textContent = DEFAULT_MAX_YEAR;
});
