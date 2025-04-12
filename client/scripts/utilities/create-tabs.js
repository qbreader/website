import { kebabCase } from './strings.js';

export default function createTabs ({ tabNames, navId = 'tabs', tabContentId = 'tab-content' }) {
  const tabContents = {};
  let first = true;
  for (const tabName of tabNames) {
    const kebabed = kebabCase(tabName);

    const button = document.createElement('button');
    button.className = 'nav-link';
    button.id = `${kebabed}-tab`;
    button.setAttribute('data-bs-toggle', 'tab');
    button.setAttribute('data-bs-target', `#${kebabed}-content`);
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.textContent = tabName;

    const div = document.createElement('div');
    div.className = 'tab-pane fade';
    div.id = `${kebabed}-content`;
    div.setAttribute('role', 'tabpanel');
    div.setAttribute('aria-labelledby', `${kebabed}-tab`);
    div.tabIndex = 0;

    if (first) {
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      div.classList.add('show', 'active');
      first = false;
    }

    document.getElementById(navId).appendChild(button);
    document.getElementById(tabContentId).appendChild(div);
    tabContents[tabName] = div;
  }

  return tabContents;
}
