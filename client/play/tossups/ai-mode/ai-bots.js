import buzzOverDistribution from './buzz-over-distribution.js';
import loadAiBots from './load-ai-bots.js';

const averageHighSchool = ({ packetLength, oldTossup, tossup }) => {
  const { correctBuzz, celerity } = buzzOverDistribution({
    correct: [46518, 49312, 59738, 60321, 58337, 57581, 58921, 60667, 59449, 57866, 57030, 55423, 53349, 48334, 40934, 37458, 37758, 27999, 7028, 2765, 3],
    incorrect: [13627, 16145, 19896, 20840, 21156, 22286, 23431, 24927, 25800, 26522, 27485, 26590, 24989, 21843, 18291, 16705, 14712, 8616, 2715, 3560, 30]
  });

  const buzzpoint = Math.floor((1 - celerity) * (tossup.question_sanitized.split(' ').length));
  return { buzzpoint, correctBuzz };
};

const averageMiddleSchool = ({ packetLength, oldTossup, tossup }) => {
  const { correctBuzz, celerity } = buzzOverDistribution({
    correct: [11337, 12754, 13830, 15806, 16889, 17129, 17422, 17639, 18710, 19444, 20610, 20667, 20683, 20837, 22565, 25328, 23742, 12888, 2407, 787, 0],
    incorrect: [2897, 3526, 3983, 4645, 4866, 5218, 5427, 5587, 6084, 6139, 6429, 6462, 6217, 6416, 6400, 6360, 4971, 2368, 1037, 1581, 12]
  });

  const buzzpoint = Math.floor((1 - celerity) * (tossup.question_sanitized.split(' ').length - 2));
  return { buzzpoint, correctBuzz };
};

const averageCollege = ({ packetLength, oldTossup, tossup }) => {
  const { correctBuzz, celerity } = buzzOverDistribution({
    correct: [16918, 19378, 23738, 22743, 21767, 21490, 21992, 21339, 20742, 19685, 19008, 17198, 15972, 14190, 11492, 9608, 9207, 7242, 1809, 218, 0],
    incorrect: [4133, 5332, 6744, 6869, 6890, 7650, 7942, 8229, 8429, 8418, 8396, 7742, 6826, 5653, 4623, 3802, 3291, 2073, 689, 872, 2]
  });

  const buzzpoint = Math.floor((1 - celerity) * (tossup.question_sanitized.split(' ').length - 1));
  return { buzzpoint, correctBuzz };
};

const averageOpen = ({ packetLength, oldTossup, tossup }) => {
  const { correctBuzz, celerity } = buzzOverDistribution({
    correct: [3584, 3744, 4005, 3407, 3128, 2907, 2588, 2371, 2219, 2139, 1895, 1671, 1482, 1348, 1149, 958, 892, 807, 310, 94, 0],
    incorrect: [1207, 1466, 1530, 1477, 1566, 1526, 1372, 1437, 1335, 1233, 1173, 1051, 912, 751, 598, 489, 404, 326, 169, 201, 0]
  });

  const buzzpoint = Math.floor((1 - celerity) * (tossup.question_sanitized.split(' ').length - 1));
  return { buzzpoint, correctBuzz };
};

const rightAfterPower = ({ packetLength, oldTossup, tossup }) => {
  let buzzpoint = Math.max(tossup.question_sanitized.split(' ').indexOf('(*)'), tossup.question_sanitized.split(' ').indexOf('[*]')) + 1;
  if (buzzpoint === 0) {
    buzzpoint = tossup.question_sanitized.split(' ').length / 2;
    buzzpoint = Math.floor(buzzpoint);
  }
  return { buzzpoint, correctBuzz: true };
};

const buzzRandomly = ({ packetLength, oldTossup, tossup }) => {
  const buzzpoint = Math.floor(Math.random() * tossup.question_sanitized.split(' ').length);
  const correctBuzz = Math.random() < 0.5;
  return { buzzpoint, correctBuzz };
};

/**
 * Should be in the format of:
 * `[name: string]: [calculateBuzzpoint: function, description: string]`
 */
const aiBots = {
  'average-high-school': [averageHighSchool, 'Average high school player on qbreader'],
  'average-middle-school': [averageMiddleSchool, 'Average middle school player on qbreader'],
  'average-college': [averageCollege, 'Average college player on qbreader'],
  'average-open': [averageOpen, 'Average open player on qbreader'],
  'right-after-power': [rightAfterPower, 'Buzz right after the power mark'],
  'buzz-randomly': [buzzRandomly, 'Buzz at a random point in the question (50% chance of being correct)']
};

loadAiBots(aiBots);
export default aiBots;
