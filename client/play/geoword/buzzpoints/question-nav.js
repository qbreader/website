const toolbarResizeObserver = new window.ResizeObserver(entries => {
  for (const { target } of entries) {
    if (target.offsetHeight > 0) { document.documentElement.style.setProperty('--buzz-toolbar-height', `${target.offsetHeight}px`); }
  }
});

/**
 * @param {object[]} tossups - one division's tossups
 * @param {(tossup: object) => string} getId
 * @returns {string} HTML for a row of links that jump to each question
 */
export function getQuestionNavHTML (tossups, getId) {
  let html = '<nav class="ms-auto" aria-label="Questions"><ul class="pagination pagination-sm flex-wrap mb-0">';
  for (const tossup of tossups) {
    html += `<li class="page-item"><a class="page-link" href="#${getId(tossup)}" aria-label="Jump to question ${tossup.questionNumber}">${tossup.questionNumber}</a></li>`;
  }
  return html + '</ul></nav>';
}

/**
 * Keeps `--buzz-toolbar-height` up to date, so that jumping to a question scrolls it out from under the sticky toolbar.
 * @param {HTMLElement} toolbar - a `.buzz-toolbar`
 */
export function observeToolbar (toolbar) {
  toolbarResizeObserver.observe(toolbar);
}

/**
 * Highlights the link to the question being read in the active tab's toolbar as the page scrolls or the tab changes.
 * @param {object} params
 * @param {HTMLElement} params.tabContent - holds a `.tab-pane` per division, each with a `.buzz-toolbar` and a `section` per question
 * @param {HTMLElement} params.tabs - the nav that switches between the tab panes
 * @returns {() => void} updates the highlight; call after rendering the questions
 */
export function trackCurrentQuestion ({ tabContent, tabs }) {
  let frame = null;

  function showCurrentQuestion () {
    frame = null;
    const pane = tabContent.querySelector('.tab-pane.active');
    const toolbar = pane?.querySelector('.buzz-toolbar');
    if (!toolbar) { return; }

    const visibleTop = Math.max(0, toolbar.getBoundingClientRect().bottom);
    const line = visibleTop + 0.3 * (window.innerHeight - visibleTop);
    const current = [...pane.querySelectorAll('section')].findLast(section => section.getBoundingClientRect().top <= line);
    for (const link of toolbar.querySelectorAll('.page-link')) {
      const active = current !== undefined && link.hash === `#${current.id}`;
      link.parentElement.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  window.addEventListener('scroll', () => {
    if (frame === null) { frame = window.requestAnimationFrame(showCurrentQuestion); }
  }, { passive: true });

  tabs.addEventListener('shown.bs.tab', showCurrentQuestion);

  return showCurrentQuestion;
}
