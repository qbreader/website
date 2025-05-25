import getBonusPartLabel from '../../scripts/utilities/get-bonus-part-label.js';

const packetId = new URLSearchParams(window.location.search).get('_id');

const { tossups, bonuses, packet } = await fetch('/api/packet?' + new URLSearchParams({ _id: packetId })).then(res => res.json());

document.getElementById('spinner').classList.add('d-none');

document.getElementById('packet-name').textContent = packet.name;
document.getElementById('packet-number').textContent = packet.number;
document.getElementById('set-name').textContent = packet.set.name;
document.getElementById('set-name').href = './set?_id=' + packet.set._id;

for (const tossup of tossups) {
  const div = tossupToHTML(tossup);
  div.classList.add('mb-2');
  const container = document.getElementById('questions');
  container.appendChild(div);
  const a = getQuestionLink('tossup', tossup._id);
  div.appendChild(a);
  container.appendChild(document.createElement('hr'));
}

for (const bonus of bonuses) {
  const div = bonusToHTML(bonus);
  div.classList.add('mb-2');
  const container = document.getElementById('questions');
  container.appendChild(div);
  const a = getQuestionLink('bonus', bonus._id);
  div.appendChild(a);
  container.appendChild(document.createElement('hr'));
}

function bonusToHTML (bonus) {
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

function getQuestionLink (type, _id) {
  const a = document.createElement('a');
  a.href = `./${type}?_id=${_id}`;
  a.textContent = ` Link to ${type}`;
  return a;
}

function tossupToHTML (tossup) {
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
