import checkAnswer from 'https://cdn.jsdelivr.net/npm/qb-answer-checker@1.1.7/dist/main.mjs';
import filterParams from '../utilities/filter-params.js';

export default class api {
  /**
   * @param {string} answerline
   * @param {string} givenAnswer
   * @returns {Promise<{
    * directive: "accept" | "prompt" | "reject",
    * directedPrompt: String | null
  * }>}
  */
  static checkAnswer (answerline, givenAnswer, strictness = 7) {
    return checkAnswer(answerline, givenAnswer, strictness);
  }

  static async getBonus (_id) {
    return await fetch('/api/bonus?' + new URLSearchParams({ _id }))
      .then(response => response.json())
      .then(data => data.bonus);
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
    const filteredParams = filterParams({ alternateSubcategories, categories, difficulties, maxYear, minYear, number, subcategories, threePartBonuses });
    return await fetch('/api/random-bonus?' + new URLSearchParams(filteredParams))
      .then(response => response.json())
      .then(response => response.bonuses);
  }

  static async getRandomTossup ({ alternateSubcategories, categories, difficulties, maxYear, minYear, number, powermarkOnly, standardOnly, subcategories }) {
    const filteredParams = filterParams({ alternateSubcategories, categories, difficulties, maxYear, minYear, number, powermarkOnly, standardOnly, subcategories });
    return await fetch('/api/random-tossup?' + new URLSearchParams(filteredParams))
      .then(response => response.json())
      .then(response => response.tossups);
  }

  static async getTossup (_id) {
    return await fetch('/api/tossup?' + new URLSearchParams({ _id }))
      .then(response => response.json())
      .then(data => data.tossup);
  }
}
