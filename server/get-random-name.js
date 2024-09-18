import { ADJECTIVES, ANIMALS } from '../constants.js';

/**
 * @returns {string} a random name
 */
function getRandomName () {
  const ADJECTIVE_INDEX = Math.floor(Math.random() * ADJECTIVES.length);
  const ANIMAL_INDEX = Math.floor(Math.random() * ANIMALS.length);
  return `${ADJECTIVES[ADJECTIVE_INDEX]}-${ANIMALS[ANIMAL_INDEX]}`;
}

export default getRandomName;
