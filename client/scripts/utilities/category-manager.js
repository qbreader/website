const SUBCATEGORIES = {
  Literature: ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature'],
  History: ['American History', 'Ancient History', 'European History', 'World History', 'Other History'],
  Science: ['Biology', 'Chemistry', 'Physics', 'Other Science'],
  'Fine Arts': ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts'],
  Religion: ['Religion'],
  Mythology: ['Mythology'],
  Philosophy: ['Philosophy'],
  'Social Science': ['Social Science'],
  'Current Events': ['Current Events'],
  Geography: ['Geography'],
  'Other Academic': ['Other Academic'],
  Trash: ['Trash']
};

const ALTERNATE_SUBCATEGORIES = {
  Literature: ['Drama', 'Long Fiction', 'Poetry', 'Short Fiction', 'Misc Literature'],
  History: [],
  Science: ['Math', 'Astronomy', 'Computer Science', 'Earth Science', 'Engineering', 'Misc Science'],
  'Fine Arts': ['Architecture', 'Dance', 'Film', 'Jazz', 'Opera', 'Photography', 'Misc Arts'],
  Religion: [],
  Mythology: [],
  Philosophy: [],
  'Social Science': ['Anthropology', 'Economics', 'Linguistics', 'Psychology', 'Sociology', 'Other Social Science'],
  'Current Events': [],
  Geography: [],
  'Other Academic': [],
  Trash: []
};

export default class CategoryManager {
  /**
     * @param {string[]} categories
     * @param {string[]} subcategories
     * @param {string[]} alternateSubcategories
     */
  constructor (categories = [], subcategories = [], alternateSubcategories = []) {
    // Should sum to 100
    this.categoryPercents = [];
    for (let i = 0; i < Object.keys(SUBCATEGORIES).length; i++) {
      this.categoryPercents.push(0);
    }
    this.percentView = false;
    this.import(categories, subcategories, alternateSubcategories);
  }

  export () {
    return {
      categories: this.categories,
      subcategories: this.subcategories,
      alternateSubcategories: this.alternateSubcategories
    };
  }

  import (categories = [], subcategories = [], alternateSubcategories = []) {
    if (categories.length > 0 && subcategories.length === 0) {
      categories.forEach(category => {
        SUBCATEGORIES[category].forEach(subcategory => {
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
      return Object.keys(SUBCATEGORIES)[Math.floor(Math.random() * Object.keys(SUBCATEGORIES).length)];
    } else {
      let random = Math.random() * total;
      for (let i = 0; i < this.categoryPercents.length; i++) {
        random -= this.categoryPercents[i];
        if (random <= 0) {
          return Object.keys(SUBCATEGORIES)[i];
        }
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
      SUBCATEGORIES[category].forEach(subcategory => {
        document.querySelector(`[for="${subcategory}"]`).classList.remove('d-none');
      });

      ALTERNATE_SUBCATEGORIES[category].forEach(subcategory => {
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
      this.subcategories = this.subcategories.filter(a => !SUBCATEGORIES[category].includes(a));
      this.alternateSubcategories = this.alternateSubcategories.filter(a => !ALTERNATE_SUBCATEGORIES[category].includes(a));
      return false;
    } else {
      this.categories.push(category);
      this.subcategories = this.subcategories.concat(SUBCATEGORIES[category]);
      this.alternateSubcategories = this.alternateSubcategories.concat(ALTERNATE_SUBCATEGORIES[category]);
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
