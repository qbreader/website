fetch('/auth/get-user-stats-bonus')
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
                document.getElementById('category-stats-body').innerHTML += `
                    <tr>
                        <th scope="row">${category}</th>
                        <td>${categoryStat.count}</td>
                        <td>${categoryStat['30s']}</td>
                        <td>${categoryStat['20s']}</td>
                        <td>${categoryStat['10s']}</td>
                        <td>${categoryStat['0s']}</td>
                        <td>${categoryStat.totalPoints}</td>
                        <td>${categoryStat.ppb.toFixed(2)}</td>
                    </tr>
                `;
            });
        }

        if (data.subcategoryStats) {
            data.subcategoryStats.forEach(subcategoryStat => {
                const subcategory = subcategoryStat._id;
                document.getElementById('subcategory-stats-body').innerHTML += `
                    <tr>
                        <th scope="row">${subcategory}</th>
                        <td>${subcategoryStat.count}</td>
                        <td>${subcategoryStat['30s']}</td>
                        <td>${subcategoryStat['20s']}</td>
                        <td>${subcategoryStat['10s']}</td>
                        <td>${subcategoryStat['0s']}</td>
                        <td>${subcategoryStat.totalPoints}</td>
                        <td>${subcategoryStat.ppb.toFixed(2)}</td>
                    </tr>
                `;
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
