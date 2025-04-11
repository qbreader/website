import { titleCase } from '../../../scripts/utilities/strings.js';

const search = new URLSearchParams(window.location.search);
const division = search.get('division');
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/paid/results/packet?' + new URLSearchParams({ packetName, division }))
  .then(response => {
    if (response.status === 403) {
      document.getElementById('packet').textContent = 'You do not have permission to view this packet. Either you have not paid for it, or you have not finished playing it. Please contact the administrator if you believe this is an error.';
    } else {
      return response.json();
    }
  })
  .then(data => {
    const { packet } = data;
    let innerHTML = '';

    for (const tossup of packet) {
      innerHTML += `<div>${tossup.questionNumber}. ${tossup.question}</div>`;
      innerHTML += `<div>ANSWER: ${tossup.answer}</div>`;
      innerHTML += `<p>&lt;${tossup.category} / ${tossup.subcategory}&gt;</p>`;
      innerHTML += '<hr class="my-3"></hr>';
    }

    document.getElementById('packet').innerHTML += innerHTML;
  });
