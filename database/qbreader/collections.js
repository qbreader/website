import { accountInfo, qbreader } from '../databases.js';

const sets = qbreader.collection('sets');
const packets = qbreader.collection('packets');
const tossups = qbreader.collection('tossups');
const bonuses = qbreader.collection('bonuses');

const tossupData = accountInfo.collection('tossup-data');
const bonusData = accountInfo.collection('bonus-data');

export {
    sets,
    packets,
    tossups,
    bonuses,
    tossupData,
    bonusData,
};
