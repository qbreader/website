import { titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');

document.getElementById('packet-name').textContent = titleCase(packetName);

const response = await fetch('/api/geoword/admin/packet-info?' + new URLSearchParams({ packetName }));

if (!response.ok) {
  document.getElementById('packet-info').replaceChildren('Could not load this packet.');
} else {
  const { packetInfo } = await response.json();
  const { divisions, questionCount, costInCents, hidden, set } = packetInfo;

  document.getElementById('info-packet').textContent = titleCase(packetInfo.name);
  document.getElementById('info-set').textContent = set ? set.name : 'None';
  document.getElementById('info-questions').textContent = questionCount;
  document.getElementById('info-cost').textContent = `$${(costInCents / 100).toFixed(2)}`;
  document.getElementById('info-divisions').textContent = divisions.join(', ');
  document.getElementById('info-teams-item').hidden = !set;
  if (set) {
    document.getElementById('info-teams').textContent = set.teamsEnabled ? 'Enabled' : 'Disabled';
  }

  const hiddenBadge = document.getElementById('hidden-badge');
  const publishedBadge = document.getElementById('published-badge');
  const publishButton = document.getElementById('publish-button');
  const unpublishButton = document.getElementById('unpublish-button');

  /**
   * @param {boolean} hidden - whether the packet is currently hidden from players
   */
  function showVisibility (hidden) {
    hiddenBadge.classList.toggle('d-none', !hidden);
    publishButton.classList.toggle('d-none', !hidden);
    publishedBadge.classList.toggle('d-none', hidden);
    unpublishButton.classList.toggle('d-none', hidden);
  }

  /**
   * @param {boolean} published - the visibility to set
   * @param {HTMLButtonElement} button - the button that was clicked
   */
  async function setPublished (published, button) {
    button.disabled = true;
    const response = await fetch('/api/geoword/admin/published?' + new URLSearchParams({ packetName, published }), { method: 'PUT' });
    button.disabled = false;

    if (response.ok) {
      showVisibility(!published);
    } else {
      window.alert('Something went wrong. Please try again.');
    }
  }

  publishButton.addEventListener('click', () => setPublished(true, publishButton));
  unpublishButton.addEventListener('click', () => {
    if (window.confirm(`Hide ${titleCase(packetName)} from players?`)) { setPublished(false, unpublishButton); }
  });

  showVisibility(hidden);

  const activeBadge = document.getElementById('active-badge');
  const inactiveBadge = document.getElementById('inactive-badge');
  const activateButton = document.getElementById('activate-button');
  const deactivateButton = document.getElementById('deactivate-button');

  /**
   * @param {boolean} active - whether new buzzes on the packet currently count toward standings
   */
  function showActive (active) {
    activeBadge.classList.toggle('d-none', !active);
    deactivateButton.classList.toggle('d-none', !active);
    inactiveBadge.classList.toggle('d-none', active);
    activateButton.classList.toggle('d-none', active);
  }

  /**
   * @param {boolean} active - the activity to set
   * @param {HTMLButtonElement} button - the button that was clicked
   */
  async function setActive (active, button) {
    button.disabled = true;
    const response = await fetch('/api/geoword/admin/active?' + new URLSearchParams({ packetName, active }), { method: 'PUT' });
    button.disabled = false;

    if (response.ok) {
      showActive(active);
    } else {
      window.alert('Something went wrong. Please try again.');
    }
  }

  activateButton.addEventListener('click', () => setActive(true, activateButton));
  deactivateButton.addEventListener('click', () => {
    if (window.confirm(`Stop new buzzes on ${titleCase(packetName)} from counting toward standings?`)) { setActive(false, deactivateButton); }
  });

  showActive(packetInfo.active);
}
