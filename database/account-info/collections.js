import { accountInfo } from '../databases.js';

const bonusData = accountInfo.collection('bonus-data');
const bonusStars = accountInfo.collection('bonus-stars');
const tossupData = accountInfo.collection('tossup-data');
const tossupStars = accountInfo.collection('tossup-stars');
const users = accountInfo.collection('users');

const usernameToId = {};
const idToUsername = {};

export {
  bonusData,
  bonusStars,
  tossupData,
  tossupStars,
  users,
  usernameToId,
  idToUsername
};
