import getSetList from '../../scripts/api/get-set-list.js';

const SET_LIST = await getSetList();
document.getElementById('set-list').innerHTML = SET_LIST.map(setName => `<option>${setName}</option>`).join('');

document.getElementById('set-name').addEventListener('change', function () {
  // make border red if set name is not in set list
  if (SET_LIST.includes(this.value) || this.value.length === 0) {
    this.classList.remove('is-invalid');
  } else {
    this.classList.add('is-invalid');
  }
});

document.getElementById('update-type').addEventListener('change', function () {
  const fields = ['difficulty', 'name', 'standard'];

  for (const field of fields) {
    document.getElementById(`${field}-div`).classList.add('d-none');
    document.getElementById(`new-set-${field}`).removeAttribute('required');
  }

  const updateType = this.value;
  document.getElementById(`${updateType}-div`).classList.remove('d-none');
  document.getElementById(`new-set-${updateType}`).setAttribute('required', 'required');
});

document.getElementById('form').addEventListener('submit', async function (event) {
  event.preventDefault();
  event.stopPropagation();
  this.classList.add('was-validated');
  if (!this.checkValidity()) { return; }

  document.getElementById('submit').disabled = true;
  document.getElementById('submit').textContent = 'Submitting...';

  const setName = document.getElementById('set-name').value;
  const updateType = document.getElementById('update-type').value;
  switch (updateType) {
    case 'difficulty': {
      const difficulty = parseInt(document.getElementById('new-set-difficulty').value);
      const response = await fetch('/api/admin/question-management/set/update-difficulty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, setName })
      });
      if (response.ok) {
        window.alert(`Set ${setName} difficulty updated successfully`);
      } else if (response.status === 404) {
        window.alert(`Set ${setName} not found`);
      } else {
        window.alert('Error updating set difficulty');
      }
      break;
    }
    case 'name': {
      const newName = document.getElementById('new-set-name').value;
      if (newName.length < 4) {
        window.alert('Set name must be at least 4 characters long');
        document.getElementById('submit').disabled = false;
        document.getElementById('submit').textContent = 'Submit';
        return;
      }
      const response = await fetch('/api/admin/question-management/set/rename-set', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName: setName, newName })
      });
      if (response.ok) {
        window.alert(`Set ${setName} renamed to ${newName} successfully`);
      } else {
        window.alert('Error renaming set');
      }
      break;
    }
    case 'standard': {
      const standard = document.getElementById('new-set-standard').value === 'true';
      const response = await fetch('/api/admin/question-management/set/update-standard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standard, setName })
      });
      if (response.ok) {
        window.alert(`Set ${setName} standardness updated successfully`);
      } else if (response.status === 404) {
        window.alert(`Set ${setName} not found`);
      } else {
        window.alert('Error updating set standardness');
      }
    }
  }

  document.getElementById('submit').disabled = false;
  document.getElementById('submit').textContent = 'Submit';
});
