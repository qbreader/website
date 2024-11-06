import { escapeHTML } from './utilities/strings.js';

/**
 * Upserts a player item to the DOM element with the id `player-list-group`.
 * @param {Player} player
 * @param {string} USER_ID - The item is highlighted blue if `USER_ID === player.userId`.
 * @param {string} ownerId - ID of the room owner
 */
// overall handling of some of these mechanics in the upsertion section might not be best idea? works though
export default function upsertPlayerItem (player, USER_ID, ownerId, socket, isPublic) {
  if (!player || !player.userId) {
    console.error('Player or player.userId is undefined', { player });
    return;
  }

  const { userId, username, powers = 0, tens = 0, negs = 0, tuh = 0, points = 0, online } = player;
  const celerity = player?.celerity?.correct?.average ?? player?.celerity ?? 0;

  const playerIsOwner = ownerId === userId;

  // Remove the existing player item if it exists
  if (document.getElementById('list-group-' + userId)) {
    document.getElementById('list-group-' + userId).remove();
  }

  const playerItem = document.createElement('a');
  playerItem.className = `list-group-item ${userId === USER_ID ? 'user-score' : ''} clickable`;
  playerItem.id = `list-group-${userId}`;
  const displayUsername = (playerIsOwner && !isPublic) ? `👑 ${escapeHTML(username)}` : escapeHTML(username);

  playerItem.innerHTML = `
      <div class="d-flex justify-content-between">
          <span id="username-${userId}">${displayUsername}</span>
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

  // ban button if the viewer is the owner and the player is not, also room has to be private
  if ((ownerId === USER_ID) && userId !== ownerId && !isPublic && userId !== 'ai-bot') {
    const banButton = document.createElement('button');
    banButton.className = 'btn btn-danger btn-sm mt-2';
    banButton.title = 'Ban an user. They can no longer join the room.';
    banButton.innerText = 'Ban';
    playerItem.appendChild(banButton);
    banButton.addEventListener('click', () => {
      socket.send(JSON.stringify({ type: 'ban', ownerId, target_user: userId, targ_name: username }));
    });
  }

  // votekick button. cannot vk an owner (change? idk)
  if (userId !== USER_ID && (isPublic || (userId !== ownerId && userId !== 'ai-bot'))) {
    const vkButton = document.createElement('button');
    vkButton.className = 'btn btn-warning btn-sm mt-2';
    vkButton.title = 'Initiate a votekick on an user. 90 second cooldown.';
    vkButton.innerText = 'VK';
    playerItem.appendChild(vkButton);
    vkButton.addEventListener('click', () => {
      socket.send(JSON.stringify({ type: 'votekick-vote', target_user: userId, targ_name: username, send_id: USER_ID }));
      socket.send(JSON.stringify({ type: 'votekick-init', target_user: userId, targ_name: username, send_id: USER_ID }));
      vkButton.disabled = true;
      vkButton.innerText = 'Cooldown';
      setTimeout(() => {
        vkButton.disabled = false;
        vkButton.innerText = 'VK';
      }, 90000);
    });
  }
  // User cannot be ai or yourself
  if (userId !== 'ai-bot' && userId !== USER_ID) {
    const muteButton = document.createElement('button');

    muteButton.className = 'btn btn-warning btn-sm mt-2';
    muteButton.title = 'Mute/Unmute an user to change visibility of what they say in chat.';
    muteButton.innerText = 'Mute';
    playerItem.appendChild(muteButton);
    muteButton.addEventListener('click', () => {
      socket.send(JSON.stringify({ type: 'mute-toggle', targetId: userId, sendingMuteId: USER_ID, muteStatus: muteButton.innerText }));
      if (muteButton.innerText === 'Unmute') {
        muteButton.innerText = 'Mute';
      } else {
        muteButton.innerText = 'Unmute';
      }
    });
  }

  // bootstrap requires "new" to be called on each popover
  // eslint-disable-next-line no-new
  new bootstrap.Popover(playerItem);
}
