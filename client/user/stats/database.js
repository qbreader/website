fetch('/auth/get-user-stats-database')
    .then(response => response.json())
    .then(data => {
        if (data.queries) {
            data.queries.forEach(query => {
                document.getElementById('recent-queries').innerHTML += `
                    <tr>
                        <td>${query.query.queryString}</td>
                        <td>${query.query.regex}</td>
                        <td>${query.createdAt}</td>
                    </tr>
                `;
            });
        }
    });
