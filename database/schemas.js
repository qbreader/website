// database schemas

import { DIFFICULTIES, CATEGORIES, SUBCATEGORIES_FLATTENED_ALL } from '../constants';

const schemas = {
  tossup: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Tossup',
    description: 'Tossup questions',
    type: 'object',
    properties: {
      _id: {
        description: 'Internal id for the tossup',
        type: 'string'
      },
      question: {
        description: 'The question text',
        type: 'string'
      },
      answer: {
        description: 'The answerline, formatted with HTML',
        type: 'string'
      },
      answer_sanitized: {
        description: 'The answerline, unformatted',
        type: 'string'
      },
      subcategory: {
        description: 'The subcategory of the question',
        type: 'string',
        enum: SUBCATEGORIES_FLATTENED_ALL
      },
      category: {
        description: 'The category of the question',
        type: 'string',
        enum: CATEGORIES
      },
      packet: {
        description: 'The internal id of the packet the question is from',
        type: 'string'
      },
      set: {
        description: 'The internal id of the set the question is from',
        type: 'string'
      },
      setName: {
        description: 'The name of the set the question is from',
        type: 'string'
      },
      type: {
        description: 'The type of the question',
        type: 'string',
        enum: ['tossup']
      },
      packetNumber: {
        description: 'The packet number of the packet the question is from',
        type: 'integer',
        minimum: 1
      },
      questionNumber: {
        description: 'The question number of the question',
        type: 'integer',
        minimum: 1
      },
      updatedAt: {
        description: 'The date the question was last updated in the database',
        type: 'string',
        format: 'date',
        pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$'
      },
      difficulty: {
        description: 'The difficulty of the question',
        type: 'integer',
        enum: DIFFICULTIES
      },
      setYear: {
        description: 'The year the set the question is from was written',
        type: 'integer'
      }
    },
    required: [
      '_id',
      'question',
      'answer',
      'answer_sanitized',
      'subcategory',
      'category',
      'packet',
      'set',
      'setName',
      'type',
      'packetNumber',
      'questionNumber',
      'updatedAt',
      'difficulty',
      'setYear'
    ]
  },
  bonus: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Bonus',
    description: 'Bonus questions',
    type: 'object',
    properties: {
      _id: {
        description: 'Internal id for the bonus',
        type: 'string'
      },
      leadin: {
        description: 'The bonus leadin text',
        type: 'string'
      },
      parts: {
        description: 'The bonus parts',
        type: 'array',
        items: {
          type: 'string'
        },
        minItems: 3,
        maxItems: 3
      },
      answers: {
        description: 'The answerlines, formatted with HTML',
        type: 'array',
        items: {
          type: 'string'
        },
        minItems: 3,
        maxItems: 3
      },
      answers_sanitized: {
        description: 'The answerlines, unformatted',
        type: 'array',
        items: {
          type: 'string'
        },
        minItems: 3,
        maxItems: 3
      },
      subcategory: {
        description: 'The subcategory of the question',
        type: 'string',
        enum: SUBCATEGORIES_FLATTENED_ALL
      },
      category: {
        description: 'The category of the question',
        type: 'string',
        enum: CATEGORIES
      },
      packet: {
        description: 'The internal id of the packet the question is from',
        type: 'string'
      },
      set: {
        description: 'The internal id of the set the question is from',
        type: 'string'
      },
      setName: {
        description: 'The name of the set the question is from',
        type: 'string'
      },
      type: {
        description: 'The type of the question',
        type: 'string',
        enum: ['bonus']
      },
      packetNumber: {
        description: 'The packet number of the packet the question is from',
        type: 'integer',
        minimum: 1
      },
      questionNumber: {
        description: 'The question number of the question',
        type: 'integer',
        minimum: 1
      },
      updatedAt: {
        description: 'The date the question was last updated in the database',
        type: 'string',
        format: 'date',
        pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$'
      },
      difficulty: {
        description: 'The difficulty of the question',
        type: 'integer',
        enum: DIFFICULTIES
      },
      setYear: {
        description: 'The year the set the question is from was written',
        type: 'integer'
      }
    },
    required: [
      '_id',
      'leadin',
      'parts',
      'answers',
      'answers_sanitized',
      'subcategory',
      'category',
      'packet',
      'set',
      'setName',
      'type',
      'packetNumber',
      'questionNumber',
      'updatedAt',
      'difficulty',
      'setYear'
    ]
  }
};

export default schemas;
