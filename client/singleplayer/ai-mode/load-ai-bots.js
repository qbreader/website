export default function loadAiBots (aiBots) {
  // eslint-disable-next-line no-unused-vars
  for (const [key, [calculateBuzzpoint, description]] of Object.entries(aiBots)) {
    document.getElementById('choose-ai').innerHTML += `
        <div class="form-check">
          <input class="form-check-input" type="radio" name="ai-choice" id="ai-choice-${key}">
          <label class="form-check-label" for="ai-choice-${key}">
            ${key} - ${description}
          </label>
        </div>
        `;
  }

  const firstBot = Object.keys(aiBots)[0];
  document.getElementById(`ai-choice-${firstBot}`).checked = true;
}
