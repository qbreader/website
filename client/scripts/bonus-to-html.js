import getBonusPartLabel from './utilities/get-bonus-part-label.js';

export default function bonusToHTML (bonus, tagPronunciationGuides = false) {
  const pronunciationGuideRegex = /(\([\u201C-\u201F][^\u201C-\u201F]*[\u201C-\u201F]\))/g;

  const div = document.createElement('div');
  const span1 = document.createElement('span');
  span1.innerHTML = `${bonus.number}. ${bonus.leadin}`;
  div.appendChild(span1);
  div.appendChild(document.createElement('br'));

  for (let i = 0; i < bonus.parts.length; i++) {
    const part = tagPronunciationGuides
      ? bonus.parts[i].replace(pronunciationGuideRegex, '<span class="pronunciation-guide">$1</span>')
      : bonus.parts[i];

    const span1 = document.createElement('span');
    span1.innerHTML = `${getBonusPartLabel(bonus, i)} ${part}`;
    div.appendChild(span1);
    div.appendChild(document.createElement('br'));
    const span2 = document.createElement('span');
    span2.innerHTML = `ANSWER: ${bonus.answers[i]}`;
    div.appendChild(span2);
    div.appendChild(document.createElement('br'));
  }

  const tag = bonus.metadata ?? `${bonus.category} / ${bonus.subcategory}${bonus.alternate_subcategory ? ' / ' + bonus.alternate_subcategory : ''}`;
  div.appendChild(document.createTextNode(`<${tag}>`));
  return div;
}
