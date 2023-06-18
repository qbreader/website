const packetName = window.location.pathname.split('/').pop();
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/geoword/api/get-divisions?' + new URLSearchParams({ packetName }))
    .then(response => response.json())
    .then(data => {
        const { divisions } = data;
        const divisionSelect = document.getElementById('division');
        divisions.forEach(division => {
            const option = document.createElement('option');
            option.value = division;
            option.textContent = division;
            divisionSelect.appendChild(option);
        });
    });

document.getElementById('form').addEventListener('submit', async event => {
    const division = document.getElementById('division').value;
    fetch('/geoword/api/record-division', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ division, packetName }),
    }).then(response => {
        if (response.ok) {
            window.location.href = '/geoword/game/' + packetName;
        } else {
            alert('Something went wrong. Please try again.');
        }
    });
});