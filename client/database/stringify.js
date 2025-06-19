import getBonusPartLabel from '../scripts/utilities/get-bonus-part-label.js';

export function stringifyBonus (bonus, includeMetadata = false) {
  let textdata = '';

  if (includeMetadata) {
    textdata += `${bonus.set.name} Packet ${bonus.packet.number}\n`;
    textdata += `Question ID: ${bonus._id}\n`;
  }

  textdata += `${bonus.number}. ${bonus.leadin_sanitized}\n`;
  for (let i = 0; i < bonus.parts.length; i++) {
    textdata += `${getBonusPartLabel(bonus, i)} ${bonus.parts_sanitized[i]}\n`;
    textdata += `ANSWER: ${bonus.answers_sanitized[i]}\n`;
  }
  textdata += `<${bonus.category} / ${bonus.subcategory}${bonus.alternate_subcategory ? ' / ' + bonus.alternate_subcategory : ''}>\n`;
  return textdata;
}

export function stringifyTossup (tossup, includeMetadata = false) {
  let textdata = '';

  if (includeMetadata) {
    textdata += `${tossup.set.name} Packet ${tossup.packet.number}\n`;
    textdata += `Question ID: ${tossup._id}\n`;
  }

  textdata += `${tossup.number}. ${tossup.question_sanitized}\n`;
  textdata += `ANSWER: ${tossup.answer_sanitized}\n`;
  textdata += `<${tossup.category} / ${tossup.subcategory}${tossup.alternate_subcategory ? ' / ' + tossup.alternate_subcategory : ''}>\n`;
  return textdata;
}
