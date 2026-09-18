/**
 * Survey Copilot — JSON Schemas for Claude structured output.
 *
 * Claude is constrained to these shapes via `output_config.format`, so
 * responses arrive as validated JSON rather than prose we have to parse.
 * The operations engine still re-validates everything (lib/survey/operations.ts) —
 * a schema guarantees shape, not that ids refer to real questions.
 */

const QUESTION_TYPES = [
  'single_select',
  'multi_select',
  'dropdown',
  'rating',
  'nps',
  'short_text',
  'long_text',
  'boolean',
  'date'
] as const

const questionSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description:
        'Set this only when a logic rule needs to target this new question; then reuse the same value as the rule targetId.'
    },
    type: { type: 'string', enum: QUESTION_TYPES },
    text: {
      type: 'string',
      description: 'The question as shown to respondents.'
    },
    helpText: { type: 'string' },
    required: { type: 'boolean' },
    options: {
      type: 'array',
      description: 'Answer choices. Required for choice-based question types.',
      items: { type: 'string' }
    },
    scale: {
      type: 'object',
      description: 'Numeric scale. Use for rating (1-5) and nps (0-10).',
      properties: {
        min: { type: 'integer' },
        max: { type: 'integer' },
        minLabel: { type: 'string' },
        maxLabel: { type: 'string' }
      },
      required: ['min', 'max'],
      additionalProperties: false
    }
  },
  required: ['type', 'text', 'required'],
  additionalProperties: false
} as const

/** Schema for generateSurvey(). */
export const SURVEY_SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      estimatedMinutes: {
        type: 'integer',
        description: 'Realistic completion time for the survey you produced.'
      },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            questions: { type: 'array', items: questionSchema }
          },
          required: ['title', 'questions'],
          additionalProperties: false
        }
      }
    },
    required: ['title', 'description', 'sections', 'estimatedMinutes'],
    additionalProperties: false
  }
} as const

/**
 * One survey operation.
 *
 * Kept deliberately lean: the API caps a schema at 24 optional parameters, and
 * embedding the full question shape several times blows that budget. So this
 * carries a minimal inline question (`type`/`text`/`required`/`options`/`scale`
 * are the fields that matter for edits) and covers the operation kinds the
 * Copilot actually needs. `move_question` and `add_section` are omitted from
 * the Claude contract — the engine still supports them for the builder's own
 * drag-and-drop — because the model never needs to emit them.
 *
 * The API also rejects `additionalProperties: true` and schema composition
 * (`oneOf`), hence one flat object with `operation` selecting the kind. The
 * operations engine does the real per-kind validation, so an operation missing
 * a field it needs is rejected with a reason rather than corrupting state.
 */
const opQuestionSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description:
        'Set only when a logic rule must target this new question; reuse the same value as the rule targetId.'
    },
    type: { type: 'string', enum: QUESTION_TYPES },
    text: { type: 'string' },
    required: { type: 'boolean' },
    options: {
      type: 'array',
      items: { type: 'string' },
      description: 'Answer choices, for choice-based types.'
    },
    scale: {
      type: 'object',
      properties: {
        min: { type: 'integer' },
        max: { type: 'integer' },
        minLabel: { type: 'string' },
        maxLabel: { type: 'string' }
      },
      required: ['min', 'max', 'minLabel', 'maxLabel'],
      additionalProperties: false
    }
  },
  required: ['type', 'text', 'required'],
  additionalProperties: false
} as const

const operationSchema = {
  type: 'object',
  properties: {
    operation: {
      type: 'string',
      enum: [
        'add_question',
        'update_question',
        'delete_question',
        'split_question',
        'add_logic'
      ]
    },
    questionId: {
      type: 'string',
      description:
        'Target question id, from the survey given to you. Required for update, delete and split.'
    },
    sectionId: {
      type: 'string',
      description: 'Target section id. Required for add_question.'
    },
    index: { type: 'integer', description: 'Insert position. Optional.' },
    question: opQuestionSchema,
    changes: opQuestionSchema,
    replacements: {
      type: 'array',
      items: opQuestionSchema,
      description: 'Two or more questions replacing the target, for split.'
    },
    logic: {
      type: 'object',
      properties: {
        questionId: { type: 'string' },
        operator: {
          type: 'string',
          enum: [
            'equals',
            'not_equals',
            'less_than',
            'greater_than',
            'contains',
            'is_answered',
            'is_not_answered'
          ]
        },
        value: {
          type: 'string',
          description: 'Comparison value; numeric strings are coerced.'
        },
        action: {
          type: 'string',
          enum: [
            'show_question',
            'hide_question',
            'skip_to_section',
            'end_survey'
          ]
        },
        targetId: { type: 'string' }
      },
      required: ['questionId', 'operator', 'action', 'value', 'targetId'],
      additionalProperties: false
    }
  },
  required: ['operation'],
  additionalProperties: false
} as const

/** Schema for reviewSurvey(). */
export const REVIEW_SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      health: {
        type: 'object',
        properties: {
          score: { type: 'integer', description: '0-100 overall quality.' },
          clarity: { type: 'integer' },
          structure: { type: 'integer' },
          length: { type: 'integer' },
          coverage: { type: 'integer' },
          summary: { type: 'string' }
        },
        required: [
          'score',
          'clarity',
          'structure',
          'length',
          'coverage',
          'summary'
        ],
        additionalProperties: false
      },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [
                'double_barrelled',
                'leading_question',
                'duplicate_question',
                'confusing_wording',
                'poor_answer_choices',
                'unnecessary_question',
                'excessive_length',
                'missing_followup'
              ]
            },
            severity: { type: 'string', enum: ['low', 'medium', 'high'] },
            questionId: {
              type: 'string',
              description:
                'Id of the question this concerns, from the survey given to you. Empty string for survey-wide issues.'
            },
            message: {
              type: 'string',
              description: 'Short headline, e.g. "Q7 may be double-barrelled".'
            },
            rationale: {
              type: 'string',
              description: 'Why this harms data quality.'
            },
            fix: {
              type: 'object',
              properties: {
                summary: { type: 'string' },
                actionLabel: {
                  type: 'string',
                  description: 'Button verb: "Apply Fix", "Remove" or "Add".'
                },
                operations: {
                  type: 'array',
                  items: operationSchema,
                  description: 'Operations that resolve this issue.'
                }
              },
              required: ['summary', 'actionLabel', 'operations'],
              additionalProperties: false
            }
          },
          required: [
            'type',
            'severity',
            'questionId',
            'message',
            'rationale',
            'fix'
          ],
          additionalProperties: false
        }
      }
    },
    required: ['health', 'issues'],
    additionalProperties: false
  }
} as const

/**
 * Schema for generateEmails().
 *
 * `body` is an array of paragraphs rather than one string: the editor edits
 * paragraphs individually, and asking for them pre-split avoids guessing at
 * newline conventions in the response.
 */
export const EMAILS_SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      emails: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['invitation', 'reminder'] },
            subject: {
              type: 'string',
              description: 'Subject line. Specific, under about 60 characters.'
            },
            preheader: {
              type: 'string',
              description:
                'Preview text shown after the subject in most mail clients.'
            },
            greeting: {
              type: 'string',
              description: 'Opening line, e.g. "Hi there,".'
            },
            body: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Body paragraphs in order. Two or three short paragraphs.'
            },
            ctaLabel: {
              type: 'string',
              description: 'Button label, e.g. "Start the survey".'
            },
            signOff: {
              type: 'string',
              description: 'Closing line, e.g. "Thank you,".'
            },
            senderName: {
              type: 'string',
              description: 'Who the email is from, e.g. "The Acme Team".'
            }
          },
          required: [
            'kind',
            'subject',
            'preheader',
            'greeting',
            'body',
            'ctaLabel',
            'signOff',
            'senderName'
          ],
          additionalProperties: false
        }
      },
      changes: {
        type: 'array',
        items: { type: 'string' },
        description: 'One short sentence per email, for the user.'
      }
    },
    required: ['emails', 'changes'],
    additionalProperties: false
  }
} as const

/** Schema for refineSurvey() / generateLogic(). */
export const OPERATIONS_SCHEMA = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      operations: { type: 'array', items: operationSchema },
      changes: {
        type: 'array',
        items: { type: 'string' },
        description: 'One short sentence per change, for the user.'
      },
      note: {
        type: 'string',
        description:
          'Set only when no operations apply, explaining why, addressed to the user.'
      }
    },
    required: ['operations', 'changes'],
    additionalProperties: false
  }
} as const
