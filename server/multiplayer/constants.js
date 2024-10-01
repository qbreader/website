import { CATEGORIES, SUBCATEGORIES_FLATTENED } from '../../quizbowl/constants.js';

export const ROOM_NAME_MAX_LENGTH = 32;
export const USERNAME_MAX_LENGTH = 32;

/**
 * List of multiplayer permanent room names.
 */
export const PERMANENT_ROOMS = [
  {
    name: 'hsquizbowl',
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES_FLATTENED
  },
  {
    name: 'collegequizbowl',
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES_FLATTENED
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
    name: 'trash',
    categories: ['Trash'],
    subcategories: ['Trash']
  }
];
