import { CATEGORIES, CATEGORY_TO_SUBCATEGORY, SUBCATEGORIES } from '../../quizbowl/categories.js';

export const ROOM_NAME_MAX_LENGTH = 32;
export const USERNAME_MAX_LENGTH = 32;

export const MAX_ONLINE_PLAYERS = 500;

/**
 * List of multiplayer permanent room names.
 */
export const PERMANENT_ROOMS = [
  {
    name: 'msquizbowl',
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES
  },
  {
    name: 'hsquizbowl',
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES
  },
  {
    name: 'collegequizbowl',
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES
  },
  {
    name: 'literature',
    categories: ['Literature'],
    subcategories: CATEGORY_TO_SUBCATEGORY.Literature
  },
  {
    name: 'history',
    categories: ['History'],
    subcategories: CATEGORY_TO_SUBCATEGORY.History
  },
  {
    name: 'science',
    categories: ['Science'],
    subcategories: CATEGORY_TO_SUBCATEGORY.Science
  },
  {
    name: 'fine-arts',
    categories: ['Fine Arts'],
    subcategories: CATEGORY_TO_SUBCATEGORY['Fine Arts']
  },
  {
    name: 'rmpss',
    categories: ['Religion', 'Mythology', 'Philosophy', 'Social Science'],
    subcategories: ['Religion', 'Mythology', 'Philosophy', 'Social Science']
  },
  {
    name: 'geography',
    categories: ['Geography'],
    subcategories: CATEGORY_TO_SUBCATEGORY.Geography
  },
  {
    name: 'pop-culture',
    categories: ['Pop Culture'],
    subcategories: CATEGORY_TO_SUBCATEGORY['Pop Culture']
  }
];

/**
 * Verified rooms
 * Same categories as permanent rooms, with verified- prefix.
 */
export const VERIFIED_ROOMS = PERMANENT_ROOMS.map(room => ({
  name: `verified-${room.name}`,
  categories: room.categories,
  subcategories: room.subcategories
}));
