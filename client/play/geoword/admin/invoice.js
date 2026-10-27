const search = new URLSearchParams(window.location.search);
const _id = search.get('_id');
const packetName = search.get('packetName');

fetch('/api/geoword/admin/invoice?' + new URLSearchParams({ _id, packetName }))
  .then(response => response.json())
  .then(data => {
    const { amount, payment } = data;
    const { packet, set, user_id: userId, username, createdAt } = payment;
    document.getElementById('date').textContent = new Date(createdAt).toLocaleString();
    document.getElementById('packet-name').textContent = packet?.name ?? `All packets in ${set.name}`;
    document.getElementById('packet-id').textContent = packet?._id ?? set._id;
    document.getElementById('user-id').textContent = userId;
    document.getElementById('username').textContent = username;
    document.getElementById('amount').textContent = (amount / 100).toFixed(2);
  });
