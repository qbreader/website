import { readSetStats, showSetPackets } from './set-stats.js';
import showCategoryLeaderboards from '../results/category-leaderboards.js';
import { titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const setName = search.get('setName');

document.getElementById('set-name').textContent = titleCase(setName);

fetch('/api/geoword/set-results/category-stats?' + new URLSearchParams({ setName }))
  .then(readSetStats)
  .then(data => {
    showSetPackets(data.packetNames);
    showCategoryLeaderboards(data.leaderboards, data.username);
  });
