export default function reportQuestion (_id, reason, description) {
  document.getElementById('report-question-submit').disabled = true;
  fetch('/api/report-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _id, reason, description })
  }).then(response => {
    if (response.status === 200) {
      document.getElementById('report-question-reason').value = 'wrong-category';
      document.getElementById('report-question-description').value = '';
      window.alert('Question has been reported.');
    } else {
      window.alert('There was an error reporting the question.');
    }
  }).catch(_error => {
    window.alert('There was an error reporting the question.');
  }).finally(() => {
    document.getElementById('report-question-close').click();
    document.getElementById('report-question-submit').disabled = false;
  });
}
