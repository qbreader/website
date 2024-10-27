import { CATEGORIES, CATEGORY_TO_SUBCATEGORY, CATEGORY_TO_ALTERNATE_SUBCATEGORIES } from './categories.js';

export default class CategoryManager {
  /**
     * @param {string[]} categories
     * @param {string[]} subcategories
     * @param {string[]} alternateSubcategories
     */
  constructor (categories = [], subcategories = [], alternateSubcategories = []) {
    // Should sum to 100
    this.categoryPercents = [];
    for (let i = 0; i < CATEGORIES.length; i++) {
      this.categoryPercents.push(0);
    }
    this.percentView = false;
    this.import(categories, subcategories, alternateSubcategories);
  }

  export () {
    return {
      categories: this.categories,
      subcategories: this.subcategories,
      alternateSubcategories: this.alternateSubcategories,
      percentView: this.percentView,
      categoryPercents: this.categoryPercents
    };
  }

  import (categories = [], subcategories = [], alternateSubcategories = [], percentView = false, categoryPercents = []) {
    if (categories.length > 0 && subcategories.length === 0) {
      categories.forEach(category => {
        CATEGORY_TO_SUBCATEGORY[category].forEach(subcategory => {
          subcategories.push(subcategory);
        });
      });
    }

    this.categories = categories;
    this.subcategories = subcategories;
    this.alternateSubcategories = alternateSubcategories;
  }

  getRandomCategory () {
    const total = this.categoryPercents.reduce((a, b) => a + b, 0);
    if (total === 0) {
      // uniformly return a random category
      return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    } else {
      let random = Math.random() * total;
      for (let i = 0; i < this.categoryPercents.length; i++) {
        random -= this.categoryPercents[i];
        if (random <= 0) { return CATEGORIES[i]; }
      }
    }
  }

  /**
     * @param {JSON} question
     * @returns {boolean} Whether or not the question is part of the valid category and subcategory combination.
     */
  isValidCategory (question) {
    if (this.categories.length === 0 && this.subcategories.length === 0) {
      return true;
    }

    return this.categories.includes(question.category) && this.subcategories.includes(question.subcategory);
  }

  /**
     * Updates the category modal to show the given categories and subcategories.
     * @returns {void}
     */
  loadCategoryModal () {
    document.querySelectorAll('#categories input').forEach(element => { element.checked = false; });
    document.querySelectorAll('#subcategories input').forEach(element => { element.checked = false; });
    document.querySelectorAll('#subcategories label').forEach(element => { element.classList.add('d-none'); });
    document.querySelectorAll('#alternate-subcategories input').forEach(element => { element.checked = false; });
    document.querySelectorAll('#alternate-subcategories label').forEach(element => { element.classList.add('d-none'); });

    if (this.categories.length === 0 && this.subcategories.length === 0) {
      document.getElementById('subcategory-info-text').classList.remove('d-none');
    } else {
      document.getElementById('subcategory-info-text').classList.add('d-none');
    }

    for (const category of this.categories) {
      document.getElementById(category).checked = true;
      CATEGORY_TO_SUBCATEGORY[category].forEach(subcategory => {
        document.querySelector(`[for="${subcategory}"]`).classList.remove('d-none');
      });

      CATEGORY_TO_ALTERNATE_SUBCATEGORIES[category].forEach(subcategory => {
        document.querySelector(`[for="${subcategory}"]`).classList.remove('d-none');
      });
    }

    for (const subcategory of this.subcategories) {
      document.getElementById(subcategory).checked = true;
    }

    for (const alternateSubcategory of this.alternateSubcategories) {
      document.getElementById(alternateSubcategory).checked = true;
    }
  }

  /**
     * Adds the given category if it is not in the list of valid categories.
     * Otherwise, the category is removed.
     * @param {string} category
     * @returns {boolean} true if the category was added, false if the category was removed
     */
  updateCategory (category) {
    if (this.categories.includes(category)) {
      this.categories = this.categories.filter(a => a !== category);
      this.subcategories = this.subcategories.filter(a => !CATEGORY_TO_SUBCATEGORY[category].includes(a));
      this.alternateSubcategories = this.alternateSubcategories.filter(a => !CATEGORY_TO_ALTERNATE_SUBCATEGORIES[category].includes(a));
      return false;
    } else {
      this.categories.push(category);
      this.subcategories = this.subcategories.concat(CATEGORY_TO_SUBCATEGORY[category]);
      this.alternateSubcategories = this.alternateSubcategories.concat(CATEGORY_TO_ALTERNATE_SUBCATEGORIES[category]);
      return true;
    }
  }

  /**
     * Adds the given subcategory if it is not in the list of valid subcategories.
     * Otherwise, the subcategory is removed.
     * @param {String} subcategory
     */
  updateSubcategory (subcategory) {
    if (this.subcategories.includes(subcategory)) {
      this.subcategories = this.subcategories.filter(a => a !== subcategory);
      return false;
    } else {
      this.subcategories.push(subcategory);
      return true;
    }
  }

  /**
     * Adds the given subcategory if it is not in the list of valid subcategories.
     * Otherwise, the subcategory is removed.
     * @param {String} alternateSubcategory
     */
  updateAlternateSubcategory (alternateSubcategory) {
    if (this.alternateSubcategories.includes(alternateSubcategory)) {
      this.alternateSubcategories = this.alternateSubcategories.filter(a => a !== alternateSubcategory);
      return false;
    } else {
      this.alternateSubcategories.push(alternateSubcategory);
      return true;
    }
  }
}
