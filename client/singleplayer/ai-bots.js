const rightAfterPower = ({ packetLength, oldTossup, tossup }) => {
  let buzzpoint = tossup.question_sanitized.split(' ').indexOf('(*)') + 1;
  if (buzzpoint === 0) {
    buzzpoint = tossup.question_sanitized.split(' ').length / 2;
    buzzpoint = Math.floor(buzzpoint);
  }
  return { buzzpoint, correctBuzz: true };
};

const aiBots = {
  'right-after-power': rightAfterPower
};

export default aiBots;
