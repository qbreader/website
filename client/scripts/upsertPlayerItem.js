import { escapeHTML } from './utilities/strings.js';

/**
 * Upserts a player item to the DOM element with the id `player-list-group`.
 * @param {Player} player
 * @param {string} USER_ID - The item is highlighted blue if `USER_ID === player.userId`.
 * @param {boolean} isOwner - This is who the owner of the room is 
 */
export default function upsertPlayerItem (player, USER_ID, isOwner) {
  const { userId, username, powers = 0, tens = 0, negs = 0, tuh = 0, points = 0, online } = player;
  const celerity = player?.celerity?.correct?.average ?? player?.celerity ?? 0;
  //change later?
  let res = "No";
  if (isOwner) {
    res = "Yes"
  } 
  if (document.getElementById('list-group-' + userId)) {
    document.getElementById('list-group-' + userId).remove();
  }

  const playerItem = document.createElement('a');
  playerItem.className = `list-group-item ${userId === USER_ID ? 'user-score' : ''} clickable`;
  playerItem.id = `list-group-${userId}`;

  let ifOwner = isOwner ? 'data-owner="true" style="color: red;"' : "";
  playerItem.innerHTML = `
      <div class="d-flex justify-content-between">
          <span id="username-${userId}" ${ifOwner}>${escapeHTML(username)}</span>
          <span><span id="points-${userId}" class="badge rounded-pill ${online ? 'bg-success' : 'bg-secondary'}">${points}</span></span>
      </div>
      `;
  
  playerItem.setAttribute('data-bs-container', 'body');
  playerItem.setAttribute('data-bs-custom-class', 'custom-popover');
  playerItem.setAttribute('data-bs-html', 'true');
  playerItem.setAttribute('data-bs-placement', 'left');
  playerItem.setAttribute('data-bs-toggle', 'popover');
  playerItem.setAttribute('data-bs-trigger', 'focus');
  playerItem.setAttribute('tabindex', '0');

  playerItem.setAttribute('data-bs-title', username);
  playerItem.setAttribute('data-bs-content', `
      <ul class="list-group list-group-flush">
          <li class="list-group-item">
              <span>Powers</span>
              <span id="powers-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${powers}</span>
          </li>
          <li class="list-group-item">
              <span>Tens</span>
              <span id="tens-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${tens}</span>
          </li>
          <li class="list-group-item">
              <span>Negs</span>
              <span id="negs-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${negs}</span>
          </li>
          <li class="list-group-item">
              <span>TUH</span>
              <span id="tuh-${userId}" class="float-end badge rounded-pill bg-secondary stats-${userId}">${tuh}</span>
          </li>
          <li class="list-group-item">
              <span>Celerity</span>
              <span id="celerity-${userId}" class="float-end stats stats-${userId}">${celerity.toFixed(3)}</span>
          </li>
          <li class="list-group-item">
              <span>Is Owner?</span>
              <span id="owner-${userId}" class="float-end stats stats-${userId}">${res}</span>
          </li>
          
      </ul>
      `);

  document.getElementById('player-list-group').appendChild(playerItem);
  // bootstrap requires "new" to be called on each popover
  // eslint-disable-next-line no-new
  new bootstrap.Popover(playerItem);
}
