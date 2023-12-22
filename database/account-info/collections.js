import { accountInfo } from '../databases.js';

const bonusData = accountInfo.collection('bonus-data');
const bonusStars = accountInfo.collection('bonus-stars');
const tossupData = accountInfo.collection('tossup-data');
const tossupStars = accountInfo.collection('tossup-stars');
const users = accountInfo.collection('users');

const username_to_id = {};
const id_to_username = {};

export {
    bonusData,
    bonusStars,
    tossupData,
    tossupStars,
    users,
    username_to_id,
    id_to_username,
};
