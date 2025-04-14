import createTabs from '../../scripts/utilities/create-tabs.js';
import { escapeHTML, titleCase } from '../../scripts/utilities/strings.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/admin/geoword/protests?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    const { protests: allProtests } = data;

    const divs = createTabs({ tabNames: Object.keys(allProtests) });

    for (const division of Object.keys(allProtests)) {
      const { packet, protests } = allProtests[division];

      let innerHTML = '';
      for (const tossup of packet) {
        const { questionNumber } = tossup;
        innerHTML += `<div>${tossup.questionNumber}. ${tossup.question}</div>`;
        innerHTML += `<div>ANSWER: ${tossup.answer}</div>`;
        innerHTML += `<p>&lt;${tossup.category} / ${tossup.subcategory}&gt;</p>`;

        if (protests.filter(protest => protest.questionNumber === questionNumber).length === 0) {
          innerHTML += '<hr>';
          continue;
        }

        innerHTML += '<h5>Protests:</h5>';
        innerHTML += '<ul class="list-group mb-3">';
        for (const protest of protests.filter(protest => protest.questionNumber === questionNumber && protest.pendingProtest)) {
          innerHTML += `
            <li class="list-group-item d-flex justify-content-between">
              <span>
                <b>${escapeHTML(protest.username + ': ' || '')}</b>
                <span id="given-answer-${protest._id}">${protest.givenAnswer}</span>
                ${getPromptString(protest)}
                (celerity: ${protest.celerity.toFixed(3)}) - pending review
              </span>
              <a id="${protest._id}" question="${questionNumber}" href="#" data-bs-toggle="modal" data-bs-target="#resolve-protest-modal">Resolve protest</a>
            </li>
          `;
        }

        for (const protest of protests.filter(protest => protest.questionNumber === questionNumber && !protest.pendingProtest)) {
          const resolution = `resolution: ${protest.decision} ${getProtestReasonString(protest)}`;

          innerHTML += `
            <li class="list-group-item">
              <span><b>${escapeHTML(protest.username + ': ' || '')}</b><span>${protest.givenAnswer} ${getPromptString(protest)}</span> - ${resolution}</span>
            </li>
          `;
        }

        innerHTML += '</ul>';
        innerHTML += '<hr>';
      }

      divs[division].innerHTML += innerHTML;

      document.querySelectorAll('a[data-bs-toggle="modal"]').forEach(a => {
        a.addEventListener('click', () => {
          document.getElementById('resolve-protest-id').value = a.id;
          document.getElementById('resolve-protest-given-answer').value = document.getElementById(`given-answer-${a.id}`).textContent;
          document.getElementById('resolve-protest-actual-answer').innerHTML = packet[parseInt(a.attributes.question.value) - 1].answer;
        });
      });
    }
  });

document.getElementById('resolve-protest-submit').addEventListener('click', () => {
  const _id = document.getElementById('resolve-protest-id').value;
  const decision = document.getElementById('resolve-protest-decision').value;
  const reason = document.getElementById('resolve-protest-reason').value;

  fetch('/api/admin/geoword/resolve-protest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buzz_id: _id, decision, reason })
  }).then(response => {
    if (response.status === 200) {
      window.location.reload();
    } else {
      window.alert('Error resolving protest');
    }
  });
});

function getPromptString (protest) {
  if (!protest?.prompts) {
    return '';
  }

  let string = '(prompted on: ';
  for (const answer of protest.prompts) {
    string += answer + ', ';
  }
  string = string.slice(0, -2);
  string = string + ')';
  return string;
}

function getProtestReasonString (protest) {
  if (!protest?.reason || protest.reason === '') {
    return '';
  }

  return `(reason: ${protest.reason})`;
}
