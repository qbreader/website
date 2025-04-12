import createTabs from '../../../scripts/utilities/create-tabs.js';
import { titleCase } from '../../../scripts/utilities/strings.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/paid/results/packet?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    const { packets } = data;

    const divs = createTabs({ tabNames: Object.keys(packets) });

    for (const division of Object.keys(packets)) {
      const packet = packets[division];
      const div = divs[division];
      let innerHTML = '';
      for (const tossup of packet) {
        innerHTML += `<div>${tossup.questionNumber}. ${tossup.question}</div>`;
        innerHTML += `<div>ANSWER: ${tossup.answer}</div>`;
        innerHTML += `<p>&lt;${tossup.category} / ${tossup.subcategory}&gt;</p>`;
        innerHTML += '<hr class="my-3"></hr>';
      }
      div.innerHTML += innerHTML;
    }
  });
