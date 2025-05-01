import { CATEGORIES, SUBCATEGORIES } from '../../quizbowl/categories.js';

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
    subcategories: ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature']
  },
  {
    name: 'history',
    categories: ['History'],
    subcategories: ['American History', 'Ancient History', 'European History', 'World History', 'Other History']
  },
  {
    name: 'science',
    categories: ['Science'],
    subcategories: ['Biology', 'Chemistry', 'Physics', 'Other Science']
  },
  {
    name: 'fine-arts',
    categories: ['Fine Arts'],
    subcategories: ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts']
  },
  {
    name: 'rmpss',
    categories: ['Religion', 'Mythology', 'Philosophy', 'Social Science'],
    subcategories: ['Religion', 'Mythology', 'Philosophy', 'Social Science']
  },
  {
    name: 'geography',
    categories: ['Geography'],
    subcategories: ['Geography']
  },
  {
    name: 'pop culture',
    categories: ['Pop Culture'],
    subcategories: ['Pop Culture']
  }
];
