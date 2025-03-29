import { accountInfo, qbreader } from '../databases.js';

const sets = qbreader.collection('sets');
const packets = qbreader.collection('packets');
const tossups = qbreader.collection('tossups');
const bonuses = qbreader.collection('bonuses');

const perTossupData = accountInfo.collection('tossup-data');
const perBonusData = accountInfo.collection('bonus-data');

export {
  sets,
  packets,
  tossups,
  bonuses,
  perTossupData,
  perBonusData
};
