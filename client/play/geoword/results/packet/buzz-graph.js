const SVG_NS = 'http://www.w3.org/2000/svg';
const PADDING = { left: 26, right: 10, top: 8, bottom: 6 };
const CLUE_LABEL_MIN_HEIGHT = 90;

const graphs = new WeakMap();

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp (value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {string} name
 * @param {object} attributes
 * @returns {SVGElement}
 */
function createSvgElement (name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

/**
 * @param {HTMLElement} graph
 * @returns {{ x: (time: number) => number, y: (count: number) => number, width: number, height: number, plotHeight: number }}
 */
function getScales (graph) {
  const { duration, correct, wrong } = graphs.get(graph);
  const width = graph.clientWidth;
  const height = graph.clientHeight;
  const plotWidth = Math.max(1, width - PADDING.left - PADDING.right);
  const bottom = height - PADDING.bottom - (height >= CLUE_LABEL_MIN_HEIGHT ? 12 : 0);
  const plotHeight = Math.max(1, bottom - PADDING.top);
  const max = Math.max(1, correct.length, wrong.length);

  return {
    x: time => PADDING.left + (clamp(time, 0, duration) / duration) * plotWidth,
    y: count => bottom - (count / max) * plotHeight,
    width,
    height,
    plotHeight
  };
}

/**
 * @param {number[]} times
 * @param {(time: number) => number} x
 * @param {(count: number) => number} y
 * @param {number} duration
 * @returns {string}
 */
function getStepPath (times, x, y, duration) {
  let d = `M${x(0)},${y(0)}`;
  times.forEach((time, index) => { d += ` H${x(time)} V${y(index + 1)}`; });
  return d + ` H${x(duration)}`;
}

/**
 * @param {HTMLElement} graph
 * @param {{ duration: number, starts: number[], correct: number[], wrong: number[] }} [data]
 */
export function drawBuzzGraph (graph, data) {
  if (data) {
    graphs.set(graph, { time: null, buzz: null, ...graphs.get(graph), ...data });
  }
  const state = graphs.get(graph);
  if (!state) { return; }
  graph.querySelector('svg')?.remove();
  if (graph.clientWidth === 0) { return; }

  const { duration, starts, correct, wrong } = state;
  const { x, y, width, height } = getScales(graph);
  const svg = createSvgElement('svg', { width, height, viewBox: `0 0 ${width} ${height}`, 'aria-hidden': 'true' });
  const max = Math.max(1, correct.length, wrong.length);

  starts.forEach((start, index) => {
    svg.append(createSvgElement('line', { x1: x(start), x2: x(start), y1: y(max), y2: y(0), class: 'buzz-graph-clue' }));
    if (height >= CLUE_LABEL_MIN_HEIGHT) {
      const label = createSvgElement('text', { x: x(start) + 3, y: height - PADDING.bottom, class: 'buzz-graph-label' });
      label.textContent = index + 1;
      svg.append(label);
    }
  });
  svg.append(createSvgElement('line', { x1: x(0), x2: x(duration), y1: y(max), y2: y(max), class: 'buzz-graph-grid' }));
  svg.append(createSvgElement('line', { x1: x(0), x2: x(duration), y1: y(0), y2: y(0), class: 'buzz-graph-axis' }));
  for (const count of [0, max]) {
    const label = createSvgElement('text', { x: PADDING.left - 5, y: y(count), 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'buzz-graph-label' });
    label.textContent = count;
    svg.append(label);
  }

  svg.append(createSvgElement('path', { d: getStepPath(correct, x, y, duration), class: 'buzz-graph-correct' }));
  svg.append(createSvgElement('path', { d: getStepPath(wrong, x, y, duration), class: 'buzz-graph-wrong' }));
  svg.append(createSvgElement('line', { y1: y(max) - 4, y2: y(0), class: 'buzz-graph-playhead', visibility: 'hidden' }));
  svg.append(createSvgElement('circle', { r: 4, class: 'buzz-graph-dot', visibility: 'hidden' }));

  graph.prepend(svg);
  setBuzzGraphPlayhead(graph, state.time);
  setBuzzGraphDot(graph, state.buzz);
}

/**
 * @param {HTMLElement} graph
 * @param {number} clientX
 * @returns {number}
 */
export function getBuzzGraphTime (graph, clientX) {
  const { duration } = graphs.get(graph);
  const plotWidth = Math.max(1, graph.clientWidth - PADDING.left - PADDING.right);
  return clamp((clientX - graph.getBoundingClientRect().left - PADDING.left) / plotWidth, 0, 1) * duration;
}

/**
 * @param {HTMLElement} graph
 * @param {number} time
 * @returns {{ correct: number, wrong: number }}
 */
export function countBuzzGraphBuzzes (graph, time) {
  const { correct, wrong } = graphs.get(graph);
  return { correct: correct.filter(t => t <= time).length, wrong: wrong.filter(t => t <= time).length };
}

/**
 * @param {HTMLElement} graph
 * @param {number | null} time
 */
export function setBuzzGraphPlayhead (graph, time) {
  const state = graphs.get(graph);
  if (!state) { return; }
  state.time = time;
  const playhead = graph.querySelector('.buzz-graph-playhead');
  if (!playhead) { return; }
  playhead.setAttribute('visibility', time === null ? 'hidden' : 'visible');
  if (time !== null) {
    const x = getScales(graph).x(time);
    playhead.setAttribute('x1', x);
    playhead.setAttribute('x2', x);
  }
}

/**
 * @param {HTMLElement} graph
 * @param {{ time: number, isCorrect: boolean } | null} buzz
 */
export function setBuzzGraphDot (graph, buzz) {
  const state = graphs.get(graph);
  if (!state) { return; }
  state.buzz = buzz;
  const dot = graph.querySelector('.buzz-graph-dot');
  if (!dot) { return; }
  dot.setAttribute('visibility', buzz === null ? 'hidden' : 'visible');
  if (buzz !== null) {
    const { x, y } = getScales(graph);
    const times = buzz.isCorrect ? state.correct : state.wrong;
    dot.setAttribute('cx', x(buzz.time));
    dot.setAttribute('cy', y(times.filter(t => t <= buzz.time).length));
    dot.classList.toggle('buzz-graph-dot-wrong', !buzz.isCorrect);
  }
}
