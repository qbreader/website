import { titleCase } from '../../scripts/utilities/strings.js';

const search = new URLSearchParams(window.location.search);
const division = search.get('division');
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;
document.getElementById('division').textContent = division;

fetch('/api/admin/geoword/stats?' + new URLSearchParams({ packetName, division }))
  .then(response => response.json())
  .then(data => {
    const { stats } = data;

    let innerHTML = '<hr>';

    for (const i in stats) {
      innerHTML += `
            <div class="row mb-3">
                <div class="col-6">
                    <div><b>#${stats[i].tossup.questionNumber}</b></div>
                    <div><b>Times heard:</b> ${stats[i].timesHeard}</div>
                    <div><b>Number correct:</b> ${stats[i].numberCorrect}</div>
                    <div><b>Answer:</b> ${stats[i].tossup.answer}</div>
                </div>
                <div class="col-6">
                    <div><b>Best buzz:</b> ${stats[i].bestUsername}</div>
                    <div><b>Best celerity:</b> ${(stats[i].bestCelerity ?? 0.0).toFixed(3)}</div>
                    <div><b>Average correct celerity:</b> ${(stats[i].averageCorrectCelerity ?? 0).toFixed(3)}</div>
                    <div><b>Average points:</b> ${(stats[i].averagePoints ?? 0.0).toFixed(2)}</div>
                </div>
            </div>
            <hr>
            `;
    }

    document.getElementById('stats').innerHTML = innerHTML;
  });
