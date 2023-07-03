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
            for (const protest of protests.filter(protest => protest.questionNumber === questionNumber && protest.pendingProtest)) {
                innerHTML += `<li class="list-group-item d-flex justify-content-between">
                    <span>
                        <b>${escapeHTML(protest.username + ': ' || '')}</b>
                        <span id="given-answer-${protest._id}">${protest.givenAnswer}</span>
                        (celerity: ${protest.celerity.toFixed(3)}) - pending review
                    </span>
                    <a id="${protest._id}" question="${questionNumber}" href="#" data-bs-toggle="modal" data-bs-target="#resolve-protest-modal">Resolve protest</a>
                </li>`;
            }

            for (const protest of protests.filter(protest => protest.questionNumber === questionNumber && !protest.pendingProtest)) {
                const resolution = `resolved: ${protest.decision} (reason: ${protest.reason || 'none'})`;

                innerHTML += `<li class="list-group-item">
                    <span><b>${escapeHTML(protest.username + ': ' || '')}</b><span>${protest.givenAnswer}</span> - ${resolution}</span>
                </li>`;
            }

            innerHTML += '</ul>';
            innerHTML += '<hr>';
        }

        document.getElementById('protests').innerHTML += innerHTML;

        document.querySelectorAll('a[data-bs-toggle="modal"]').forEach(a => {
            a.addEventListener('click', () => {
                document.getElementById('resolve-protest-id').value = a.id;
                document.getElementById('resolve-protest-given-answer').value = document.getElementById(`given-answer-${a.id}`).textContent;
                document.getElementById('resolve-protest-actual-answer').innerHTML = packet[parseInt(a.attributes.question.value) - 1].formatted_answer;
            });
        });
    });

document.getElementById('resolve-protest-submit').addEventListener('click', () => {
    const id = document.getElementById('resolve-protest-id').value;
    const decision = document.getElementById('resolve-protest-decision').value;
    const reason = document.getElementById('resolve-protest-reason').value;

    fetch('/api/geoword/admin/resolve-protest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision, reason }),
    }).then(response => {
        if (response.status === 200) {
            window.location.reload();
        } else {
            alert('Error resolving protest');
        }
    });
});

function escapeHTML(unsafe) {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\'', '&#039;');
}
