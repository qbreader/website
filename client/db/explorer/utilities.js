import getBonusPartLabel from '../../scripts/utilities/get-bonus-part-label.js';

export function bonusToHTML (bonus) {
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

export function mongoIdToDate (_id) {
  const timestamp = _id.toString().substring(0, 8);
  return new window.Date(parseInt(timestamp, 16) * 1000);
}

export function tossupToHTML (tossup) {
  const div = document.createElement('div');
  const span1 = document.createElement('span');
  span1.innerHTML = `${tossup.number}. ${tossup.question}`;
  div.appendChild(span1);
  div.appendChild(document.createElement('br'));
  const span2 = document.createElement('span');
  span2.innerHTML = `ANSWER: ${tossup.answer}`;
  div.appendChild(span2);
  div.appendChild(document.createElement('br'));
  div.appendChild(document.createTextNode(`<${tossup.category} / ${tossup.subcategory}${tossup.alternate_subcategory ? ' / ' + tossup.alternate_subcategory : ''}>`));
  return div;
}
