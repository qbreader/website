export default class API {
    /**
     * @param {String} setName
     * @returns {Promise<Number>} The number of packets in the set.
     */
    static async getNumPackets(setName) {
        if (setName === undefined || setName === '') {
            return 0;
        }

        return fetch('/api/num-packets?' + new URLSearchParams({ setName }))
            .then(response => response.json())
            .then(data => data.numPackets);
    }

    static reportQuestion(_id, reason, description) {
        document.getElementById('report-question-submit').disabled = true;
        fetch('/api/report-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id, reason, description }),
        }).then(response => {
            if (response.status === 200) {
                document.getElementById('report-question-reason').value = 'wrong-category';
                document.getElementById('report-question-description').value = '';
                alert('Question has been reported.');
            } else {
                alert('There was an error reporting the question.');
            }
        }).catch(_error => {
            alert('There was an error reporting the question.');
        }).finally(() => {
            document.getElementById('report-question-close').click();
            document.getElementById('report-question-submit').disabled = false;
        });
    }
}
