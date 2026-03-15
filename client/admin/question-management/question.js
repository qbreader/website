const questionTypeSelect = document.getElementById('question-type');
const questionIdInput = document.getElementById('question-id');
const loadButton = document.getElementById('load-question');
const previewDiv = document.getElementById('question-preview');
const previewHeader = document.getElementById('preview-header');
const previewBody = document.getElementById('preview-body');
const tossupForm = document.getElementById('tossup-form');
const bonusForm = document.getElementById('bonus-form');

function escapeHTML (text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function showPreview (type, data) {
  previewDiv.classList.remove('d-none');
  if (type === 'tossup') {
    const tossup = data;
    const alternateSubcategory = tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : '';
    previewHeader.innerHTML = `<b>${escapeHTML(tossup.set.name)} | ${escapeHTML(tossup.category)} | ${escapeHTML(tossup.subcategory)}${escapeHTML(alternateSubcategory)} | ${tossup.difficulty}</b>`;
    previewBody.innerHTML = `<span>${tossup.question}</span><hr><div><b>ANSWER:</b> ${tossup.answer}</div>`;
  } else {
    const bonus = data;
    const alternateSubcategory = bonus.alternate_subcategory ? ' (' + bonus.alternate_subcategory + ')' : '';
    previewHeader.innerHTML = `<b>${escapeHTML(bonus.set.name)} | ${escapeHTML(bonus.category)} | ${escapeHTML(bonus.subcategory)}${escapeHTML(alternateSubcategory)} | ${bonus.difficulty}</b>`;
    let bodyHTML = `<div>${bonus.leadin}</div>`;
    for (let i = 0; i < bonus.parts.length; i++) {
      bodyHTML += `<div>[10] ${bonus.parts[i]}</div>`;
      bodyHTML += `<div><b>ANSWER:</b> ${bonus.answers[i]}</div>`;
    }
    previewBody.innerHTML = bodyHTML;
  }
}

loadButton.addEventListener('click', async function () {
  const questionType = questionTypeSelect.value;
  const questionId = questionIdInput.value.trim();

  if (!questionId) {
    questionIdInput.classList.add('is-invalid');
    return;
  }
  questionIdInput.classList.remove('is-invalid');

  tossupForm.classList.add('d-none');
  bonusForm.classList.add('d-none');
  previewDiv.classList.add('d-none');

  const endpoint = questionType === 'tossup' ? '/api/tossup' : '/api/bonus';
  const response = await fetch(`${endpoint}?_id=${encodeURIComponent(questionId)}`);
  if (!response.ok) {
    window.alert(`Error loading question: ${await response.text()}`);
    return;
  }

  const data = await response.json();

  if (questionType === 'tossup') {
    const tossup = data.tossup;
    showPreview('tossup', tossup);
    document.getElementById('tossup-question').value = tossup.question;
    document.getElementById('tossup-answer').value = tossup.answer;
    tossupForm.classList.remove('d-none');
  } else {
    const bonus = data.bonus;
    showPreview('bonus', bonus);
    document.getElementById('bonus-leadin').value = bonus.leadin;
    for (let i = 0; i < bonus.parts.length; i++) {
      document.getElementById(`bonus-part-${i}`).value = bonus.parts[i];
      document.getElementById(`bonus-answer-${i}`).value = bonus.answers[i];
    }
    bonusForm.classList.remove('d-none');
  }
});

tossupForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  event.stopPropagation();

  const questionId = questionIdInput.value.trim();
  const question = document.getElementById('tossup-question').value;
  const answer = document.getElementById('tossup-answer').value;

  document.getElementById('tossup-submit').disabled = true;
  document.getElementById('tossup-submit').textContent = 'Saving...';

  const response = await fetch('/api/admin/question-management/question/update-tossup', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _id: questionId, question, answer })
  });

  if (response.ok) {
    window.alert('Tossup updated successfully');
    loadButton.click();
  } else {
    window.alert(`Error updating tossup: ${await response.text()}`);
  }

  document.getElementById('tossup-submit').disabled = false;
  document.getElementById('tossup-submit').textContent = 'Save Changes';
});

bonusForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  event.stopPropagation();

  const questionId = questionIdInput.value.trim();
  const leadin = document.getElementById('bonus-leadin').value;
  const parts = [];
  const answers = [];
  for (let i = 0; i < 3; i++) {
    parts.push(document.getElementById(`bonus-part-${i}`).value);
    answers.push(document.getElementById(`bonus-answer-${i}`).value);
  }

  document.getElementById('bonus-submit').disabled = true;
  document.getElementById('bonus-submit').textContent = 'Saving...';

  const response = await fetch('/api/admin/question-management/question/update-bonus', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _id: questionId, leadin, parts, answers })
  });

  if (response.ok) {
    window.alert('Bonus updated successfully');
    loadButton.click();
  } else {
    window.alert(`Error updating bonus: ${await response.text()}`);
  }

  document.getElementById('bonus-submit').disabled = false;
  document.getElementById('bonus-submit').textContent = 'Save Changes';
});
