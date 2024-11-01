import loadAiBots from './load-ai-bots.js';

const rightAfterPower = ({ packetLength, oldTossup, tossup }) => {
  let buzzpoint = tossup.question_sanitized.split(' ').indexOf('(*)') + 1;
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
  'right-after-power': [rightAfterPower, 'Buzz right after the power mark'],
  'buzz-randomly': [buzzRandomly, 'Buzz at a random point in the question (50% chance of being correct)']
};

loadAiBots(aiBots);
export default aiBots;
