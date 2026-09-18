/**
 * Survey Copilot — Mock AI scenario library.
 *
 * Realistic Experience.com-style survey blueprints used when no API key is
 * configured. Each scenario declares keyword groups so intent matching works
 * across many phrasings rather than one hardcoded sentence (see match.ts).
 *
 * Blueprints are plain data with no ids; ids are minted at build time so
 * every generated survey gets fresh ones.
 */

import type { QuestionType } from '@/types/survey'

/** A question blueprint — ids are assigned when the survey is built. */
export interface QuestionBlueprint {
  type: QuestionType
  text: string
  helpText?: string
  required?: boolean
  options?: string[]
  scale?: { min: number; max: number; minLabel?: string; maxLabel?: string }
  /**
   * Marks a question as a deliberate quality flaw for the demo, so
   * reviewSurvey() has something real to find. The value names the issue.
   */
  flaw?: 'double_barrelled' | 'leading' | 'duplicate' | 'poor_options'
}

export interface SectionBlueprint {
  title: string
  description?: string
  questions: QuestionBlueprint[]
}

export interface Scenario {
  key: string
  /** Shown in the UI as the template name. */
  label: string
  title: string
  description: string
  /** Terms that strongly indicate this scenario. */
  keywords: string[][]
  sections: SectionBlueprint[]
}

const SATISFACTION_5 = [
  'Very satisfied',
  'Satisfied',
  'Neutral',
  'Dissatisfied',
  'Very dissatisfied'
]

const NPS_SCALE = {
  min: 0,
  max: 10,
  minLabel: 'Not at all likely',
  maxLabel: 'Extremely likely'
}

const RATING_5 = {
  min: 1,
  max: 5,
  minLabel: 'Very dissatisfied',
  maxLabel: 'Very satisfied'
}

/**
 * Keyword groups are OR'd within a group and summed across groups, so
 * "hotel" alone matches, and "guest" + "stay" matches more strongly.
 */
export const SCENARIOS: Scenario[] = [
  {
    key: 'hotel',
    label: 'Hotel Guest Satisfaction',
    title: 'Hotel Guest Satisfaction Survey',
    description:
      'Help us understand your recent stay so we can keep improving the guest experience.',
    keywords: [
      ['hotel', 'resort', 'motel', 'lodging', 'accommodation'],
      ['guest', 'stay', 'stayed', 'staying', 'room', 'check-in', 'checkin'],
      ['hospitality', 'front desk', 'housekeeping']
    ],
    sections: [
      {
        title: 'Your Stay',
        description: 'A few quick questions about your visit.',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied were you with your overall stay?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'What was the main purpose of your stay?',
            options: [
              'Business',
              'Leisure',
              'Family visit',
              'Event or conference',
              'Other'
            ]
          }
        ]
      },
      {
        title: 'Room & Facilities',
        questions: [
          {
            type: 'rating',
            text: 'How would you rate the cleanliness of your room?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'rating',
            text: 'How satisfied were you with the room comfort and the hotel facilities?',
            flaw: 'double_barrelled',
            required: true,
            scale: RATING_5
          },
          {
            type: 'multi_select',
            text: 'Which facilities did you use during your stay?',
            options: [
              'Restaurant',
              'Bar',
              'Gym',
              'Pool',
              'Spa',
              'Business centre',
              'None of these'
            ]
          }
        ]
      },
      {
        title: 'Service',
        questions: [
          {
            type: 'rating',
            text: 'How would you rate the helpfulness of our staff?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: "Don't you agree that our front desk team was exceptionally friendly?",
            flaw: 'leading',
            options: SATISFACTION_5
          }
        ]
      },
      {
        title: 'Recommendation',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend our hotel to a friend or colleague?',
            required: true,
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'What could we do to make your next stay better?'
          }
        ]
      }
    ]
  },

  {
    key: 'post_purchase',
    label: 'Post-Purchase Experience',
    title: 'Post-Purchase Customer Experience Survey',
    description:
      'Tell us about your recent order so we can improve every step, from checkout to delivery.',
    keywords: [
      ['post-purchase', 'post purchase', 'after purchase', 'postpurchase'],
      ['order', 'ordered', 'purchase', 'purchased', 'bought', 'checkout'],
      ['delivery', 'shipping', 'shipment', 'arrived', 'packaging'],
      ['ecommerce', 'e-commerce', 'online store']
    ],
    sections: [
      {
        title: 'Overall Experience',
        description: 'Start with the big picture.',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied were you with your overall purchase experience?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'How easy was it to find what you were looking for?',
            options: [
              'Very easy',
              'Easy',
              'Neither easy nor difficult',
              'Difficult',
              'Very difficult'
            ]
          },
          {
            type: 'single_select',
            text: 'How often do you shop with us?',
            flaw: 'poor_options',
            options: ['Daily', 'Weekly', 'Often', 'Sometimes', 'Rarely']
          }
        ]
      },
      {
        title: 'Delivery',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied were you with the delivery speed?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'Did your order arrive when you expected it?',
            options: [
              'Arrived early',
              'Arrived on time',
              'Arrived slightly late',
              'Arrived very late',
              'It has not arrived'
            ]
          },
          {
            type: 'rating',
            text: 'How satisfied were you with the condition of the packaging?',
            scale: RATING_5
          }
        ]
      },
      {
        title: 'Product Quality',
        questions: [
          {
            type: 'rating',
            text: 'How would you rate the quality of the product you received?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'Did the product match its description on our website?',
            options: [
              'Exactly as described',
              'Mostly as described',
              'Somewhat different',
              'Very different'
            ]
          },
          {
            type: 'rating',
            text: 'How would you rate the quality of the product you ordered?',
            flaw: 'duplicate',
            scale: RATING_5
          }
        ]
      },
      {
        title: 'Customer Support',
        questions: [
          {
            type: 'boolean',
            text: 'Did you contact our customer support team about this order?',
            options: ['Yes', 'No']
          },
          {
            type: 'rating',
            text: 'How satisfied are you with our product and customer service?',
            flaw: 'double_barrelled',
            scale: RATING_5
          },
          {
            type: 'rating',
            text: 'How satisfied were you with the customer service you received?',
            flaw: 'duplicate',
            scale: RATING_5
          }
        ]
      },
      {
        title: 'Recommendation',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend us to a friend or colleague?',
            required: true,
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'Is there anything else you would like us to know?'
          }
        ]
      }
    ]
  },

  {
    key: 'customer_satisfaction',
    label: 'Customer Satisfaction',
    title: 'Customer Satisfaction Survey',
    description:
      'Measure customer happiness and identify the areas that matter most.',
    keywords: [
      ['csat', 'customer satisfaction', 'satisfaction'],
      ['customer', 'client', 'happy', 'happiness'],
      ['experience', 'overall']
    ],
    sections: [
      {
        title: 'Overview',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied are you with our company overall?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'How long have you been a customer?',
            options: [
              'Less than 6 months',
              '6–12 months',
              '1–3 years',
              'More than 3 years'
            ]
          }
        ]
      },
      {
        title: 'Experience',
        questions: [
          {
            type: 'rating',
            text: 'How easy is it to do business with us?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'How would you rate the value for money of our offering?',
            options: [
              'Excellent value',
              'Good value',
              'Fair value',
              'Poor value'
            ]
          },
          {
            type: 'single_select',
            text: 'How often do you use our product?',
            flaw: 'poor_options',
            options: ['Daily', 'Weekly', 'Often', 'Sometimes', 'Rarely']
          }
        ]
      },
      {
        title: 'Feedback',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend us to a friend or colleague?',
            required: true,
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'What is the one thing we could do better?'
          }
        ]
      }
    ]
  },

  {
    key: 'support',
    label: 'Customer Support Experience',
    title: 'Customer Support Experience Survey',
    description:
      'Tell us how your recent support interaction went so we can improve our service.',
    keywords: [
      ['support', 'helpdesk', 'help desk', 'service desk', 'ticket'],
      ['agent', 'representative', 'rep', 'call', 'chat', 'contacted'],
      ['resolution', 'resolved', 'issue', 'complaint']
    ],
    sections: [
      {
        title: 'Your Request',
        questions: [
          {
            type: 'single_select',
            text: 'How did you contact our support team?',
            required: true,
            options: [
              'Phone',
              'Email',
              'Live chat',
              'Help centre',
              'Social media'
            ]
          },
          {
            type: 'single_select',
            text: 'Was your issue resolved?',
            required: true,
            options: [
              'Fully resolved',
              'Partly resolved',
              'Not resolved',
              'Still in progress'
            ]
          }
        ]
      },
      {
        title: 'Service Quality',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied were you with the support you received?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'rating',
            text: 'How would you rate the knowledge and the speed of our agent?',
            flaw: 'double_barrelled',
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'How many times did you have to contact us about this issue?',
            options: ['Once', 'Twice', 'Three times', 'More than three times']
          }
        ]
      },
      {
        title: 'Feedback',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend our support to others?',
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'How could we have handled your request better?'
          }
        ]
      }
    ]
  },

  {
    key: 'employee',
    label: 'Employee Engagement',
    title: 'Employee Engagement Survey',
    description:
      'Understand how our people feel about their work, their team and their growth.',
    keywords: [
      ['employee', 'staff', 'workforce', 'colleague', 'team member'],
      ['engagement', 'engaged', 'morale', 'culture', 'workplace'],
      ['manager', 'hr', 'internal', 'onboarding', 'retention']
    ],
    sections: [
      {
        title: 'Engagement',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied are you with your role overall?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'nps',
            text: 'How likely are you to recommend this company as a place to work?',
            required: true,
            scale: NPS_SCALE
          }
        ]
      },
      {
        title: 'Work & Team',
        questions: [
          {
            type: 'rating',
            text: 'How supported do you feel by your manager?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'rating',
            text: 'How satisfied are you with your workload and your work-life balance?',
            flaw: 'double_barrelled',
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'Do you have the tools you need to do your job well?',
            options: [
              'Always',
              'Most of the time',
              'Sometimes',
              'Rarely',
              'Never'
            ]
          }
        ]
      },
      {
        title: 'Growth',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied are you with your opportunities to grow here?',
            scale: RATING_5
          },
          {
            type: 'long_text',
            text: 'What would make this a better place to work?'
          }
        ]
      }
    ]
  },

  {
    key: 'product',
    label: 'Product Feedback',
    title: 'Product Feedback Survey',
    description:
      'Gather insights about how our product is working for you and what to build next.',
    keywords: [
      ['product', 'feature', 'features', 'app', 'platform', 'software'],
      ['usability', 'roadmap', 'release', 'beta', 'ux'],
      ['feedback', 'improve']
    ],
    sections: [
      {
        title: 'Overall',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied are you with the product overall?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'How often do you use the product?',
            required: true,
            options: [
              'Daily',
              'A few times a week',
              'Weekly',
              'Monthly',
              'Less than monthly'
            ]
          }
        ]
      },
      {
        title: 'Usability',
        questions: [
          {
            type: 'rating',
            text: 'How easy is the product to use?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'multi_select',
            text: 'Which features do you use most?',
            options: [
              'Dashboards',
              'Reporting',
              'Integrations',
              'Automation',
              'Mobile app',
              'Notifications'
            ]
          },
          {
            type: 'single_select',
            text: "Wouldn't you agree the new interface is a big improvement?",
            flaw: 'leading',
            options: SATISFACTION_5
          }
        ]
      },
      {
        title: 'Feedback',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend this product to a colleague?',
            required: true,
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'What single improvement would help you most?'
          }
        ]
      }
    ]
  },

  {
    key: 'restaurant',
    label: 'Restaurant Feedback',
    title: 'Restaurant Experience Survey',
    description:
      'Tell us about your visit so we can keep the food and service at their best.',
    keywords: [
      ['restaurant', 'cafe', 'café', 'diner', 'bistro', 'eatery'],
      ['food', 'meal', 'menu', 'dining', 'dine', 'waiter', 'server'],
      ['reservation', 'table', 'takeaway', 'takeout']
    ],
    sections: [
      {
        title: 'Your Visit',
        questions: [
          {
            type: 'rating',
            text: 'How would you rate your overall dining experience?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'Which meal did you visit us for?',
            options: ['Breakfast', 'Lunch', 'Dinner', 'Drinks only']
          }
        ]
      },
      {
        title: 'Food & Service',
        questions: [
          {
            type: 'rating',
            text: 'How would you rate the quality of the food?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'rating',
            text: 'How would you rate the food quality and the speed of service?',
            flaw: 'double_barrelled',
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'How long did you wait to be seated?',
            options: [
              'No wait',
              'Under 10 minutes',
              '10–20 minutes',
              'More than 20 minutes'
            ]
          }
        ]
      },
      {
        title: 'Recommendation',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend us to a friend?',
            required: true,
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'What did you enjoy most about your visit?'
          }
        ]
      }
    ]
  },

  {
    key: 'event',
    label: 'Event Feedback',
    title: 'Event Feedback Survey',
    description:
      'Collect feedback from attendees to make our next event even better.',
    keywords: [
      ['event', 'conference', 'webinar', 'summit', 'workshop', 'meetup'],
      ['attendee', 'attended', 'session', 'speaker', 'venue', 'agenda'],
      ['registration', 'keynote']
    ],
    sections: [
      {
        title: 'Overall',
        questions: [
          {
            type: 'rating',
            text: 'How would you rate the event overall?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'Was this your first time attending?',
            options: ['Yes, first time', 'No, I have attended before']
          }
        ]
      },
      {
        title: 'Content',
        questions: [
          {
            type: 'rating',
            text: 'How relevant was the content to your work?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'multi_select',
            text: 'Which sessions did you find most valuable?',
            options: [
              'Keynote',
              'Product sessions',
              'Panel discussions',
              'Workshops',
              'Networking'
            ]
          }
        ]
      },
      {
        title: 'Logistics',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied were you with the venue and the catering?',
            flaw: 'double_barrelled',
            scale: RATING_5
          },
          {
            type: 'nps',
            text: 'How likely are you to attend our next event?',
            required: true,
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'What would you like to see at our next event?'
          }
        ]
      }
    ]
  },

  {
    key: 'healthcare',
    label: 'Patient Experience',
    title: 'Patient Experience Survey',
    description:
      'Your feedback helps us improve the care and service we provide.',
    keywords: [
      ['patient', 'healthcare', 'health care', 'clinic', 'hospital'],
      ['doctor', 'nurse', 'appointment', 'treatment', 'care', 'medical'],
      ['practice', 'surgery', 'consultation']
    ],
    sections: [
      {
        title: 'Your Visit',
        questions: [
          {
            type: 'rating',
            text: 'How would you rate your overall experience with us?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'How easy was it to book your appointment?',
            required: true,
            options: [
              'Very easy',
              'Easy',
              'Neither easy nor difficult',
              'Difficult',
              'Very difficult'
            ]
          }
        ]
      },
      {
        title: 'Care',
        questions: [
          {
            type: 'rating',
            text: 'How well did your clinician listen to your concerns?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'rating',
            text: 'How clearly was your treatment explained to you?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'How long did you wait past your appointment time?',
            options: [
              'Seen on time',
              'Under 15 minutes',
              '15–30 minutes',
              'More than 30 minutes'
            ]
          }
        ]
      },
      {
        title: 'Feedback',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend our practice to family or friends?',
            required: true,
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'How could we improve your experience?'
          }
        ]
      }
    ]
  },

  {
    key: 'nps',
    label: 'Net Promoter Score',
    title: 'Net Promoter Score Survey',
    description:
      'A short survey to measure loyalty and understand what drives it.',
    keywords: [
      ['nps', 'net promoter', 'promoter score'],
      ['loyalty', 'recommend', 'referral', 'advocacy'],
      ['short survey', 'quick survey']
    ],
    sections: [
      {
        title: 'Recommendation',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend us to a friend or colleague?',
            required: true,
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'What is the main reason for your score?',
            required: true
          }
        ]
      },
      {
        title: 'Follow-up',
        questions: [
          {
            type: 'single_select',
            text: 'Which area has the biggest impact on your score?',
            options: [
              'Product quality',
              'Customer service',
              'Value for money',
              'Ease of use',
              'Delivery experience'
            ]
          },
          {
            type: 'long_text',
            text: 'What would it take to raise your score?'
          }
        ]
      }
    ]
  },

  {
    key: 'service',
    label: 'Service Experience',
    title: 'Service Experience Survey',
    description:
      'Tell us how our service measured up so we can keep raising the bar.',
    keywords: [
      ['service experience', 'service quality', 'field service'],
      ['technician', 'appointment', 'installation', 'repair', 'visit'],
      ['service', 'serviced']
    ],
    sections: [
      {
        title: 'Overall',
        questions: [
          {
            type: 'rating',
            text: 'How satisfied were you with the service you received?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'single_select',
            text: 'Was the work completed on the first visit?',
            required: true,
            options: [
              'Yes',
              'No, it needed a follow-up visit',
              'Not yet complete'
            ]
          }
        ]
      },
      {
        title: 'Our Team',
        questions: [
          {
            type: 'rating',
            text: 'How would you rate the professionalism of our team?',
            required: true,
            scale: RATING_5
          },
          {
            type: 'rating',
            text: 'How satisfied were you with the punctuality and the tidiness of our team?',
            flaw: 'double_barrelled',
            scale: RATING_5
          }
        ]
      },
      {
        title: 'Feedback',
        questions: [
          {
            type: 'nps',
            text: 'How likely are you to recommend our service to others?',
            required: true,
            scale: NPS_SCALE
          },
          {
            type: 'long_text',
            text: 'Is there anything we could have done better?'
          }
        ]
      }
    ]
  }
]

/** Template cards surfaced on the dashboard and empty-builder states. */
export const FEATURED_TEMPLATES = [
  'customer_satisfaction',
  'post_purchase',
  'employee',
  'product',
  'nps',
  'event'
] as const
