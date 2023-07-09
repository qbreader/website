const division = decodeURIComponent(window.location.search.slice(1));
const packetName = window.location.pathname.split('/').pop();
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/packet?' + new URLSearchParams({ packetName, division }))
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
            innerHTML += `<div>ANSWER: ${tossup.formatted_answer ?? tossup.answer}</div>`;
            innerHTML += `<p>&lt;${tossup.category} / ${tossup.subcategory}&gt;</p>`;
            innerHTML += '<hr class="my-3"></hr>';
        }

        document.getElementById('packet').innerHTML += innerHTML;
    });
