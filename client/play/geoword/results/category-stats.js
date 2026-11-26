import showCategoryLeaderboards from './category-leaderboards.js';
import { titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('back-link').href = `./?packetName=${packetName}`;
document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/paid/results/category-stats?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => showCategoryLeaderboards(data.leaderboards, data.username));
