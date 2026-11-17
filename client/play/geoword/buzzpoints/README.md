# buzzpoints

Shared code for showing a geoword question's audio, clues, buzz graph and buzz table, used by the results packet page and the admin protests page.

- `html.js` builds the HTML for the clue list, buzz table and buzz graph.
- `time.js` converts a buzz's celerity into a time in the audio and the clue it landed on.
- `buzz-graph.js` draws the SVG graph of correct and wrong buzzes over time, along with its playhead and selected-buzz dot.
- `render.js` builds a question's section and draws or redraws its clues, graph and table while leaving the audio playing.
- `interactions.js` makes clicking a clue, buzz or the graph seek the audio, and highlights the current clue and playhead as it plays.
- `question-nav.js` builds the toolbar's question number links and highlights the current question as the page scrolls.
