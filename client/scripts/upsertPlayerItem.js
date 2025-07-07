import { escapeHTML } from './utilities/strings.js';

/**
 * Upserts a player item to the DOM element with the id `player-list-group`.
 * @param {Player} player
 * @param {string} USER_ID - The item is highlighted blue if `USER_ID === player.userId`.
 * @param {string} ownerId - ID of the room owner
 */
// overall handling of some of these mechanics in the upsertion section might not be best idea? works though
export default function upsertPlayerItem (player, USER_ID, ownerId, socket, isPublic) {
  if (!player || !player.userId || !player.username) {
    console.error('Player or player.userId or player.username is undefined', { player });
    return;
  }

  if (typeof player.userId !== 'string' || typeof player.username !== 'string') {
    console.error('player.userId and player.username must be strings', { player });
    return;
  }

  player.userId = escapeHTML(player.userId);
  player.username = escapeHTML(player.username);

  const { userId, username, powers = 0, tens = 0, negs = 0, tuh = 0, points = 0, online } = player;
  const celerity = player?.celerity?.correct?.average ?? player?.celerity ?? 0;

  const playerIsOwner = ownerId === userId;

  // Remove the existing player item if it exists
  if (document.getElementById('list-group-' + userId)) {
    document.getElementById('list-group-' + userId).remove();
  }

  const playerItem = document.createElement('a');
  playerItem.className = `list-group-item clickable ${userId === USER_ID ? 'user-score' : ''} ${online === false && 'offline'}`;
  playerItem.id = `list-group-${userId}`;
  const displayUsername = (playerIsOwner && !isPublic) ? `👑 ${username}` : username;

  playerItem.innerHTML = `
  <div class="d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
          <span id="username-${userId}" class="me-1">${displayUsername}</span>
          <!-- Dropdown  -->
      </div>
      <span><span id="points-${userId}" class="badge rounded-pill ${online ? 'bg-success' : 'bg-secondary'}">${points}</span></span>
  </div>
`;

  // Set attributes for the popover
  playerItem.setAttribute('data-bs-container', 'body');
  playerItem.setAttribute('data-bs-custom-class', 'custom-popover');
  playerItem.setAttribute('data-bs-html', 'true');
  playerItem.setAttribute('data-bs-placement', 'left');
  playerItem.setAttribute('data-bs-toggle', 'popover');
  playerItem.setAttribute('data-bs-trigger', 'focus');
  playerItem.setAttribute('tabindex', '0');

  // Popover content
  playerItem.setAttribute('data-bs-title', username);
  playerItem.setAttribute('data-bs-content', `
    <ul class="list-group list-group-flush">
        <li class="list-group-item"><span>Powers</span><span id="powers-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${powers}</span></li>
        <li class="list-group-item"><span>Tens</span><span id="tens-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${tens}</span></li>
        <li class="list-group-item"><span>Negs</span><span id="negs-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${negs}</span></li>
        <li class="list-group-item"><span>TUH</span><span id="tuh-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${tuh}</span></li>
        <li class="list-group-item"><span>Celerity</span><span id="celerity-${userId}" class="float-end stats stats-${userId}">${celerity.toFixed(3)}</span></li>
        <li class="list-group-item"><span>Is Owner?</span><span id="owner-${userId}" class="float-end stats stats-${userId}">${playerIsOwner ? 'Yes' : 'No'}</span></li>
    </ul>
  `);
  document.getElementById('player-list-group').appendChild(playerItem);
  const banTrigger = (ownerId === USER_ID) && userId !== ownerId && !isPublic && userId !== 'ai-bot';
  const muteTrigger = userId !== 'ai-bot' && userId !== USER_ID && !isPublic;
  const vkTrigger = userId !== USER_ID && (isPublic || (userId !== ownerId && userId !== 'ai-bot'));

  if (banTrigger || muteTrigger || vkTrigger) {
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'ms-1';

    const toggleButton = document.createElement('button');
    toggleButton.className = 'btn btn-default dropdown-toggle py-0 px-1';
    toggleButton.setAttribute('data-bs-toggle', 'dropdown');
    toggleButton.setAttribute('type', 'button');
    dropdownContainer.appendChild(toggleButton);

    const dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.setAttribute('aria-labelledby', 'playerActionsDropdown');

    if (muteTrigger) {
      const muteItem = document.createElement('li');
      const muteButton = document.createElement('button');
      muteButton.textContent = 'Mute';
      muteButton.className = 'btn btn-warning btn-sm mt-2 me-1 dropdown-item';
      muteButton.title = 'Mute/Unmute an user to change visibility of what they say in chat.';
      muteItem.appendChild(muteButton);
      dropdownMenu.appendChild(muteItem);

      muteButton.addEventListener('click', () => {
        socket.send(JSON.stringify({ type: 'toggle-mute', targetId: userId, targetUsername: player.username, muteStatus: muteButton.textContent }));
        muteButton.textContent = muteButton.textContent === 'Unmute' ? 'Mute' : 'Unmute';
      });
    }

    if (vkTrigger) {
      const kickItem = document.createElement('li');
      const vkButton = document.createElement('button');
      vkButton.className = 'btn btn-warning btn-sm mt-2 me-1 dropdown-item';
      vkButton.title = 'Initiate a votekick on an user. 90 second cooldown.';
      vkButton.textContent = 'Votekick';
      kickItem.appendChild(vkButton);
      dropdownMenu.appendChild(kickItem);

      vkButton.addEventListener('click', () => {
        socket.send(JSON.stringify({ type: 'votekick-vote', targetId: userId }));
        socket.send(JSON.stringify({ type: 'votekick-init', targetId: userId }));
        vkButton.disabled = true;
        vkButton.textContent = 'Cooldown';
        setTimeout(() => {
          vkButton.disabled = false;
          vkButton.textContent = 'VK';
        }, 90000);
      });
    }

    if (banTrigger) {
      const banItem = document.createElement('li');
      const banButton = document.createElement('button');
      banButton.className = 'btn btn-danger btn-sm mt-2 me-1 dropdown-item';
      banButton.title = 'Ban an user. They can no longer join the room.';
      banButton.textContent = 'Ban';
      banItem.appendChild(banButton);
      dropdownMenu.appendChild(banItem);

      banButton.addEventListener('click', () => {
        socket.send(JSON.stringify({ type: 'ban', targetId: userId, targetUsername: username }));
      });
    }

    dropdownContainer.appendChild(dropdownMenu);

    const usernameSpan = playerItem.querySelector(`#username-${userId}`);
    usernameSpan.classList.add('me-2');
    usernameSpan.after(dropdownContainer);
  }

  // bootstrap requires "new" to be called on each popover
  // eslint-disable-next-line no-new
  new bootstrap.Popover(playerItem);
}
