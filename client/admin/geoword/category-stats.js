const division = decodeURIComponent(window.location.pathname.split('/')[5]);
const packetName = window.location.pathname.split('/')[4];
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;
document.getElementById('division').textContent = division;

fetch('/api/admin/geoword/category-stats?' + new URLSearchParams({ packetName, division }))
    .then(response => response.json())
    .then(data => {
        const { leaderboard } = data;

        let innerHTML = '<hr>';

        for (const row of leaderboard) {
            innerHTML += `
            <div class="row mb-3">
                <div class="col-6">
                    <div><b>Category:</b> ${row.category}</div>
                    <div><b># of Questions:</b> ${row.number}</div>
                </div>
                <div class="col-6">
                    <div><b>Best player:</b> ${row.bestUsername}</div>
                    <div><b>Best average points:</b> ${(row.bestPoints ?? 0.0).toFixed(3)}</div>
                    <div><b>Average correct celerity:</b> ${(row.averageCorrectCelerity ?? 0).toFixed(3)}</div>
                    <div><b>Average points:</b> ${(row.averagePoints ?? 0.0).toFixed(2)}</div>
                </div>
            </div>
            <hr>
            `;
        }

        document.getElementById('stats').innerHTML = innerHTML;
    });
