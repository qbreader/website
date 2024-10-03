export default class api {
  static SET_LIST = [];

  /**
     * @param {string} answerline
     * @param {string} givenAnswer
     * @returns {Promise<{
        * directive: "accept" | "prompt" | "reject",
        * directedPrompt: String | null
    * }>}
    */
  static async checkAnswer (answerline, givenAnswer, strictness = null) {
    if (givenAnswer === '') {
      return { directive: 'reject', directedPrompt: null };
    }

    return await fetch('/api/check-answer?' + new URLSearchParams({ answerline, givenAnswer, ...(strictness && { strictness }) }))
      .then(response => response.json());
  }

  /**
     * @param {String} setName
     * @returns {Promise<Number>} The number of packets in the set.
     */
  static async getNumPackets (setName) {
    if (setName === undefined || setName === '') {
      return 0;
    }

    return await fetch('/api/num-packets?' + new URLSearchParams({ setName }))
      .then(response => response.json())
      .then(data => data.numPackets);
  }

  /**
     * @param {string} setName - The name of the set (e.g. "2021 ACF Fall").
     * @param {string | number} packetNumber - The packet number of the set.
     * @return {Promise<JSON[]>} An array containing the bonuses.
     */
  static async getPacketBonuses (setName, packetNumber) {
    if (setName === '') {
      return [];
    }

    return await fetch('/api/packet-bonuses?' + new URLSearchParams({ setName, packetNumber }))
      .then(response => response.json())
      .then(data => data.bonuses);
  }

  /**
     * @param {string} setName - The name of the set (e.g. "2021 ACF Fall").
     * @param {string} packetNumber - The packet number of the set.
     * @return {Promise<JSON[]>} An array containing the tossups.
     */
  static async getPacketTossups (setName, packetNumber) {
    if (setName === '') {
      return [];
    }

    return await fetch('/api/packet-tossups?' + new URLSearchParams({ setName, packetNumber }))
      .then(response => response.json())
      .then(data => data.tossups);
  }

  static async getRandomBonus ({ alternateSubcategories, categories, difficulties, maxYear, minYear, number, subcategories, threePartBonuses }) {
    return await fetch('/api/random-bonus?' + new URLSearchParams({ alternateSubcategories, categories, difficulties, maxYear, minYear, number, subcategories, threePartBonuses }))
      .then(response => response.json())
      .then(response => response.bonuses);
  }

  /**
     *
     * @returns {Promise<string>} A random adjective-noun pair that can be used as a name.
     */
  static async getRandomName () {
    return await fetch('/api/random-name')
      .then(res => res.json())
      .then(data => data.randomName);
  }

  static async getRandomTossup ({ alternateSubcategories, categories, difficulties, maxYear, minYear, number, powermarkOnly, standardOnly, subcategories }) {
    return await fetch('/api/random-tossup?' + new URLSearchParams({ alternateSubcategories, categories, difficulties, maxYear, minYear, number, powermarkOnly, standardOnly, subcategories }))
      .then(response => response.json())
      .then(response => response.tossups);
  }

  static getSetList () {
    return api.SET_LIST;
  }

  static reportQuestion (_id, reason, description) {
    document.getElementById('report-question-submit').disabled = true;
    fetch('/api/report-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id, reason, description })
    }).then(response => {
      if (response.status === 200) {
        document.getElementById('report-question-reason').value = 'wrong-category';
        document.getElementById('report-question-description').value = '';
        window.alert('Question has been reported.');
      } else {
        window.alert('There was an error reporting the question.');
      }
    }).catch(_error => {
      window.alert('There was an error reporting the question.');
    }).finally(() => {
      document.getElementById('report-question-close').click();
      document.getElementById('report-question-submit').disabled = false;
    });
  }
}

api.SET_LIST = await fetch('/api/set-list')
  .then(response => response.json())
  .then(data => data.setList);
