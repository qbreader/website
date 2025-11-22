import { MIN_YEAR as GLOBAL_MIN_YEAR, MAX_YEAR as GLOBAL_MAX_YEAR, DEFAULT_MAX_YEAR, DEFAULT_MIN_YEAR } from '../../quizbowl/constants.js';

function clip (value, min, max) {
  if (min > max) { throw new Error('clip: min cannot be greater than max'); }
  return Math.min(Math.max(value, min), max);
}

function fracToYear (frac) {
  frac = clip(frac, 0, 1);
  return GLOBAL_MIN_YEAR + Math.round(frac * (GLOBAL_MAX_YEAR - GLOBAL_MIN_YEAR));
}

function yearToFrac (year) {
  year = clip(year, GLOBAL_MIN_YEAR, GLOBAL_MAX_YEAR);
  return (year - GLOBAL_MIN_YEAR) / (GLOBAL_MAX_YEAR - GLOBAL_MIN_YEAR);
}

function setYear (year, which) {
  year = clip(year, GLOBAL_MIN_YEAR, GLOBAL_MAX_YEAR);
  if (which === 'min-year') {
    const maxYear = parseInt(document.getElementById('max-year-label').textContent);
    year = Math.min(year, maxYear);
  } else if (which === 'max-year') {
    const minYear = parseInt(document.getElementById('min-year-label').textContent);
    year = Math.max(year, minYear);
  }

  const handle = document.getElementById(`${which}-handle`);
  const handleWidth = handle.offsetWidth - 1;
  const fracFromLeft = yearToFrac(year);
  handle.style.left = `calc(${fracFromLeft * 100}% - ${fracFromLeft * handleWidth}px)`;

  const label = document.getElementById(`${which}-label`);
  label.textContent = year;
}

function sliderEventListener (event, which, callback) {
  event.preventDefault();
  const slider = document.getElementById('year-slider');
  const handle = event.target;
  let lastSeenYear = null;

  function onMove (e) {
    const rect = slider.getBoundingClientRect();
    const handleWidth = handle.offsetWidth - 1;
    const clientX = e.clientX ?? e.touches[0].clientX;
    lastSeenYear = fracToYear((clientX - rect.left - handleWidth) / (rect.width - handleWidth));
    setYear(lastSeenYear, which);
  }

  function onEnd () {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
    if (lastSeenYear !== null) {
      callback(lastSeenYear, which);
    }
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchmove', onMove);
  document.addEventListener('touchend', onEnd);
}

/**
 * Adds event listeners to the year slider component for handling user interactions.
 * Sets up mousedown listeners on both min-year and max-year handles, and a click listener
 * on the slider itself to allow direct year selection by clicking on the slider track.
 *
 * @param {(year: number, which: 'min-year' | 'max-year') => void} callback - invoked when the slider is interacted with
 * @returns {void}
 */
function addSliderEventListeners (callback) {
  document.getElementById('min-year-handle').addEventListener('mousedown', event => sliderEventListener(event, 'min-year', callback));
  document.getElementById('min-year-handle').addEventListener('touchstart', event => sliderEventListener(event, 'min-year', callback));
  document.getElementById('max-year-handle').addEventListener('mousedown', event => sliderEventListener(event, 'max-year', callback));
  document.getElementById('max-year-handle').addEventListener('touchstart', event => sliderEventListener(event, 'max-year', callback));
  document.getElementById('year-slider').addEventListener('click', event => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const minYearHandle = document.getElementById('min-year-handle');
    const maxYearHandle = document.getElementById('max-year-handle');
    const midpointX = (minYearHandle.offsetLeft + maxYearHandle.offsetLeft + maxYearHandle.offsetWidth) / 2;
    const handleWidth = minYearHandle.offsetWidth - 1;
    const year = fracToYear((clickX - handleWidth) / (rect.width - handleWidth));
    callback(year, clickX < midpointX ? 'min-year' : 'max-year');
  });
}

setYear(DEFAULT_MIN_YEAR, 'min-year');
setYear(DEFAULT_MAX_YEAR, 'max-year');

export { setYear, addSliderEventListeners };
