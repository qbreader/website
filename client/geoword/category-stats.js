const packetName = window.location.pathname.split('/').pop();
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/category-stats?' + new URLSearchParams({ packetName }))
    .then(response => response.json())
    .then(data => {
        const { division, leaderboard, userStats } = data;
        document.getElementById('division').textContent = division;

        let innerHTML = '<hr>';

        for (const i in leaderboard) {
            innerHTML += `
            <div class="row mb-3">
                <div class="col-6">
                    <div><b>Category:</b> ${leaderboard[i].category}</div>
                    <div><b>Average Celerity:</b> ${(userStats[i]?.averageCelerity?.toFixed(3) ?? 'N/A')}</div>
                    <div><b>Average Points:</b> ${(userStats[i]?.averagePoints?.toFixed(3) ?? 'N/A')}</div>
                    <div><b># of Questions:</b> ${leaderboard[i].number}</div>
                </div>
                <div class="col-6">
                    <div><b>Best player:</b> ${leaderboard[i].bestUsername}</div>
                    <div><b>Best average points:</b> ${(leaderboard[i].bestPoints ?? 0.0).toFixed(3)}</div>
                    <div><b>Average correct celerity:</b> ${(leaderboard[i].averageCorrectCelerity ?? 0).toFixed(3)}</div>
                    <div><b>Average points:</b> ${(leaderboard[i].averagePoints ?? 0.0).toFixed(2)}</div>
                </div>
            </div>
            <hr>
            `;
        }
        document.getElementById('stats').innerHTML = innerHTML;
    });
