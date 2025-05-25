import getBonusPartLabel from '../../scripts/utilities/get-bonus-part-label.js';

const packetId = new URLSearchParams(window.location.search).get('_id');

fetch('/api/packet?' + new URLSearchParams({ _id: packetId }))
  .then(res => res.json())
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');

    for (const tossup of data.tossups) {
      const div = tossupToHTML(tossup);
      div.classList.add('mb-2');
      const container = document.getElementById('questions');
      container.appendChild(div);
      const a = editQuestionButton('tossup', tossup._id);
      container.appendChild(a);
    }

    for (const bonus of data.bonuses) {
      const div = bonusToHTML(bonus);
      div.classList.add('mb-2');
      const container = document.getElementById('questions');
      container.appendChild(div);
      const a = editQuestionButton('bonus', bonus._id);
      container.appendChild(a);
    }
  });

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

function editQuestionButton (type, _id) {
  const a = document.createElement('a');
  a.href = `./${type}?_id=${_id}`;
  a.textContent = `Edit this ${type}`;
  a.className = 'btn btn-primary mb-3';
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
