function fetchBonusStats({ difficulties = '', setName = '', includeMultiplayer = true, includeSingleplayer = true, startDate = '', endDate = '' } = {}) {
    fetch('/auth/user-stats/bonus?' + new URLSearchParams({ difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }))
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthenticated');
            }
            return response;
        })
        .then(response => response.json())
        .then(data => {
            for (const type of ['category', 'subcategory']) {
                if (!data[`${type}Stats`]) {
                    continue;
                }

                let innerHTML = '';
                const totalStats = {};
                data[`${type}Stats`].forEach(stat => {
                    innerHTML += `
                        <tr>
                            <th scope="row">${stat._id}</th>
                            <td>${stat.count}</td>
                            <td>${stat['30s']}</td>
                            <td>${stat['20s']}</td>
                            <td>${stat['10s']}</td>
                            <td>${stat['0s']}</td>
                            <td>${stat.totalPoints}</td>
                            <td>${stat.ppb.toFixed(2)}</td>
                        </tr>
                        `;

                    Object.keys(stat).forEach(key => {
                        if (['_id', 'ppb'].includes(key)) {
                            return;
                        }

                        if (totalStats[key]) {
                            totalStats[key] += stat[key];
                        } else {
                            totalStats[key] = stat[key];
                        }
                    });

                });
                document.getElementById(`${type}-stats-body`).innerHTML = innerHTML;

                totalStats.ppb = totalStats.count > 0 ? totalStats.totalPoints / totalStats.count : 0;
                document.getElementById(`${type}-stats-foot`).innerHTML = `
                <tr>
                    <th scope="col">Total</th>
                    <th scope="col">${totalStats.count ?? 0}</th>
                    <th scope="col">${totalStats['30s'] ?? 0}</th>
                    <th scope="col">${totalStats['20s'] ?? 0}</th>
                    <th scope="col">${totalStats['10s'] ?? 0}</th>
                    <th scope="col">${totalStats['0s'] ?? 0}</th>
                    <th scope="col">${totalStats.totalPoints ?? 0}</th>
                    <th scope="col">${totalStats.ppb.toFixed(2)}</th>
                </tr>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

fetchBonusStats();

function onSubmit(event) {
    event.preventDefault();
    const setName = document.getElementById('set-name').value;
    const difficulties = getDifficulties();
    // const includeMultiplayer = document.getElementById('include-multiplayer').checked;
    // const includeSingleplayer = document.getElementById('include-singleplayer').checked;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    fetchBonusStats({ difficulties, setName, startDate, endDate });
}
