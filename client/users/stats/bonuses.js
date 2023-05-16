fetch('/auth/get-stats-bonus')
    .then(response => {
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        return response;
    })
    .then(response => response.json())
    .then(data => {
        if (data.categoryStats) {
            data.categoryStats.forEach(categoryStat => {
                const category = categoryStat._id;
                const averagePoints = categoryStat.count > 0 ? 0.01 * Math.round(100 * categoryStat.totalPoints / categoryStat.count) : 0;
                document.getElementById('category-stats-body').innerHTML += `
                    <tr>
                        <th scope="row">${category}</th>
                        <td>${categoryStat.count}</td>
                        <td>${categoryStat['30s']}</td>
                        <td>${categoryStat['20s']}</td>
                        <td>${categoryStat['10s']}</td>
                        <td>${categoryStat['0s']}</td>
                        <td>${categoryStat.totalPoints}</td>
                        <td>${averagePoints}</td>
                    </tr>
                `;
            });
        }

        if (data.subcategoryStats) {
            data.subcategoryStats.forEach(subcategoryStat => {
                const subcategory = subcategoryStat._id;
                const averagePoints = subcategoryStat.count > 0 ? 0.01 * Math.round(100 * subcategoryStat.totalPoints / subcategoryStat.count) : 0;
                document.getElementById('subcategory-stats-body').innerHTML += `
                    <tr>
                        <th scope="row">${subcategory}</th>
                        <td>${subcategoryStat.count}</td>
                        <td>${subcategoryStat['30s']}</td>
                        <td>${subcategoryStat['20s']}</td>
                        <td>${subcategoryStat['10s']}</td>
                        <td>${subcategoryStat['0s']}</td>
                        <td>${subcategoryStat.totalPoints}</td>
                        <td>${averagePoints}</td>
                    </tr>
                `;
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
