const search = new URLSearchParams(window.location.search);
const _id = search.get('_id');

fetch('/api/admin/geoword/invoice?' + new URLSearchParams({ _id }))
  .then(response => response.json())
  .then(data => {
    const { amount, payment } = data;
    const { packet, user_id: userId, username, createdAt } = payment;
    document.getElementById('date').textContent = new Date(createdAt).toLocaleString();
    document.getElementById('packet-name').textContent = packet.name;
    document.getElementById('packet-id').textContent = packet._id;
    document.getElementById('user-id').textContent = userId;
    document.getElementById('username').textContent = username;
    document.getElementById('amount').textContent = (amount / 100).toFixed(2);
  });
