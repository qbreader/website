import getBonusPartLabel from '../scripts/utilities/get-bonus-part-label.js';

export default function bonusToHTML (bonus) {
  const div = document.createElement('div');
  const span1 = document.createElement('span');
  span1.innerHTML = `${bonus.number}. ${bonus.leadin}`;
  div.appendChild(span1);
  div.appendChild(document.createElement('br'));

  for (let i = 0; i < bonus.parts.length; i++) {
    const span1 = document.createElement('span');
    span1.innerHTML = `${getBonusPartLabel(bonus, i)} ${bonus.parts[i]}`;
    div.appendChild(span1);
    div.appendChild(document.createElement('br'));
    const span2 = document.createElement('span');
    span2.innerHTML = `ANSWER: ${bonus.answers[i]}`;
    div.appendChild(span2);
    div.appendChild(document.createElement('br'));
  }

  div.appendChild(document.createTextNode(`<${bonus.category} / ${bonus.subcategory}${bonus.alternate_subcategory ? ' / ' + bonus.alternate_subcategory : ''}>`));
  return div;
}
