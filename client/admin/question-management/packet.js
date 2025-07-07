import getPacketList from '../../scripts/api/packet-list.js';
import getSetList from '../../scripts/api/get-set-list.js';

const SET_LIST = await getSetList();
document.getElementById('set-list').innerHTML = SET_LIST.map(setName => `<option>${setName}</option>`).join('');

document.getElementById('packet-number-checkbox').addEventListener('change', function () {
  for (const option of document.getElementById('packet-number').options) {
    option.textContent = this.checked
      ? `#${option.value}: ${option.textContent}`
      : option.textContent.slice(option.textContent.indexOf(':') + 2);
  }
});

document.getElementById('set-name').addEventListener('change', function () {
  // make border red if set name is not in set list
  if (SET_LIST.includes(this.value) || this.value.length === 0) {
    this.classList.remove('is-invalid');
  } else {
    this.classList.add('is-invalid');
  }
});

document.getElementById('set-name').addEventListener('input', async function () {
  const setName = this.value;
  if (!SET_LIST.includes(setName)) { return; }

  const packetList = await getPacketList(setName);
  const packetNumberSelect = document.getElementById('packet-number');
  packetNumberSelect.innerHTML = '';

  for (const packet of packetList) {
    const option = document.createElement('option');
    option.value = packet.number;
    option.textContent = `${packet.name}`;
    packetNumberSelect.appendChild(option);
  }
});

document.getElementById('update-type').addEventListener('change', function () {
  const fields = ['packet-name'];

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
    case 'name': {
      const packetNumber = parseInt(document.getElementById('packet-number').value);
      const newName = document.getElementById('new-packet-name').value;
      const response = await fetch('/api/admin/question-management/packet/rename-packet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setName, packetNumber, newPacketName: newName })
      });
      if (response.ok) {
        window.alert(`Packet ${packetNumber} of ${setName} successfully renamed to ${newName}`);
      } else {
        window.alert('Error renaming packet');
      }
      break;
    }
  }

  document.getElementById('submit').disabled = false;
  document.getElementById('submit').textContent = 'Submit';
});
