import { readSetStats, showSetPackets } from './set-stats.js';
import showLeaderboard from '../leaderboard-tables.js';
import { titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const setName = search.get('setName');

document.getElementById('set-name').textContent = titleCase(setName);

fetch('/api/geoword/set-results/leaderboard?' + new URLSearchParams({ setName }))
  .then(readSetStats)
  .then(data => {
    showSetPackets(data.packetNames);
    showLeaderboard(data.leaderboard);
  });
