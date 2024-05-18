import { geoword } from '../databases.js';

const audio = geoword.collection('audio');
const buzzes = geoword.collection('buzzes');
const divisionChoices = geoword.collection('division-choices');
const packets = geoword.collection('packets');
const payments = geoword.collection('payments');
const tossups = geoword.collection('tossups');

export {
  audio,
  buzzes,
  divisionChoices,
  packets,
  payments,
  tossups
};
