import { readSetStats, showSetPackets } from './set-stats.js';
import showTeamLeaderboard from '../team-leaderboard-tables.js';
import { titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const setName = search.get('setName');

document.getElementById('set-name').textContent = titleCase(setName);

fetch('/api/geoword/set-results/team-leaderboard?' + new URLSearchParams({ setName }))
  .then(readSetStats)
  .then(data => {
    showSetPackets(data.packetNames);
    showTeamLeaderboard(data.teamLeaderboard);
  });
