import api from '../scripts/api/index.js';
import CategoryManager from '../scripts/utilities/category-manager';

const queryDefaults = {
  alternateSubcategories: [],
  categories: [],
  difficulties: [],
  minYear: 2010,
  maxYear: 2024,
  packetNumbers: [],
  powermarkOnly: false,
  selectBySetName: false,
  setName: '',
  standardOnly: false,
  subcategories: [],
  version: '09-29-2024'
};

const settingsDefaults = {
  readingSpeed: 50,
  rebuzz: false,
  showHistory: true,
  timer: true,
  typeToAnswer: true
};

export default class TossupRoom {
  constructor ({ queryLock, queryUnlock, savedQuery, savedSettings, timer }) {
    this.queryLock = queryLock;
    this.queryUnlock = queryUnlock;
    this.savedQuery = savedQuery;
    this.savedSettings = savedSettings;
    this.timer = timer;

    this.players = {};

    this.previous = {
      isCorrect: true,
      inPower: false,
      negValue: -5,
      powerValue: 15,
      endOfQuestion: false,
      celerity: 0
    };

    this.status = {
      buzzedIn: null,
      buzzes: [],
      buzzpointIndices: [],
      maxPacketNumber: 24,
      paused: false,
      questionNumber: 0,
      tossup: null,
      tossupSplit: null
    };

    this.cache = {
      randomTossup: [],
      set: []
    };

    this.query = savedQuery?.version === queryDefaults.version ? JSON.parse(savedQuery) : queryDefaults;
    this.categoryManager = new CategoryManager();
    this.categoryManager.import(this.query.categories, this.query.subcategories, this.query.alternateSubcategories);

    this.settings = savedSettings?.version === settingsDefaults.version ? JSON.parse(this.settings) : settingsDefaults;
  }

  async advanceQuestion () {
    if (this.query.selectBySetName) {
      let validCategory;
      do {
        this.status.questionNumber++;
        if (this.status.questionNumber >= this.cache.set.length) {
          this.query.packetNumbers.shift();
          if (this.query.packetNumbers.length === 0) { return false; }
        }

        try {
          this.queryLock();
          this.cache.set = await api.getPacketTossups(this.query.setName);
        }

        validCategory = this.categoryManager.isValidCategory(this.cache.set[this.status.questionNumber]);
      } while (!validCategory);
    }
  }

  async getRandomTossup() { throw new Error('Not implemented'); }
}
