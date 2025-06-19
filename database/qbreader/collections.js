import { accountInfo, qbreader } from '../databases.js';

export const sets = qbreader.collection('sets');
export const packets = qbreader.collection('packets');
export const tossups = qbreader.collection('tossups');
export const bonuses = qbreader.collection('bonuses');

export const perTossupData = accountInfo.collection('per-tossup-data');
export const perBonusData = accountInfo.collection('per-bonus-data');
