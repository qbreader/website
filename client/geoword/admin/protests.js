const division = decodeURIComponent(window.location.pathname.split('/')[5]);
const packetName = window.location.pathname.split('/')[4];
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;
document.getElementById('division').textContent = division;

fetch('/api/geoword/admin/protests?' + new URLSearchParams({ packetName, division }))
    .then(response => response.json())
    .then(data => {
        const { protests, packet } = data;

        let innerHTML = '';
        for (const tossup of packet) {
            const { questionNumber } = tossup;
            innerHTML += `<div>${tossup.questionNumber}. ${tossup.question}</div>`;
            // innerHTML += '<hr class="my-3"></hr>';
            innerHTML += `<div>ANSWER: ${tossup.formatted_answer ?? tossup.answer}</div>`;
            innerHTML += `<p>&lt;${tossup.category} / ${tossup.subcategory}&gt;</p>`;

            if (protests.filter(protest => protest.questionNumber === questionNumber).length === 0) {
                innerHTML += '<hr>';
                continue;
            }

            innerHTML += '<h5>Protests:</h5>';
            innerHTML += '<ul class="list-group mb-3">';
            for (const protest of protests.filter(protest => protest.questionNumber === questionNumber)) {
                const resolution = protest.pendingProtest ? 'pending review' : `resolved: ${protest.decision} (reason: ${protest.reason ?? 'none'})`;

                innerHTML += `<li class="list-group-item d-flex justify-content-between">
                    <span><b>${escapeHTML(protest.username + ': ' ?? '')}</b>${protest.givenAnswer} - ${resolution}</span>
                    ${protest.pendingProtest ? `<a id=${protest._id} href="#" data-bs-toggle="modal" data-bs-target="#resolve-protest-modal">Resolve protest</a>` : ''}
                </li>`;
            }

            innerHTML += '</ul>';
            innerHTML += '<hr>';
        }

        document.getElementById('protests').innerHTML += innerHTML;

        document.querySelectorAll('a[data-bs-toggle="modal"]').forEach(a => {
            a.addEventListener('click', () => {
                document.getElementById('resolve-protest-id').value = a.id;
            });
        });
    });

function escapeHTML(unsafe) {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\'', '&#039;');
}
