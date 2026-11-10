import { accountInfo } from '../databases.js';

export const bonusStars = accountInfo.collection('bonus-stars');
export const perBonusData = accountInfo.collection('per-bonus-data');
export const perTossupData = accountInfo.collection('per-tossup-data');
export const tossupStars = accountInfo.collection('tossup-stars');
export const users = accountInfo.collection('users');

// case insensitive collation for email comparison on sign in
export const emailCollation = { locale: 'en', strength: 2 };

export const usernameToId = {};
export const idToUsername = {};
