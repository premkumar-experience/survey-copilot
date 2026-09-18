'use client'

/**
 * Survey Copilot — survey state.
 *
 * Survey data lives in React state only; there is no database for the MVP.
 * A past/future stack gives real undo/redo, which matters because the AI
 * mutates the survey and the user must always be able to take it back.
 *
 * Snapshots are whole surveys. They are small (tens of KB at most) and this
 * keeps undo trivially correct, which is worth more than the memory.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode
} from 'react'

import type { AIReview } from '@/types/ai'
import type {
  Question,
  QuestionType,
  Survey,
  SurveyEmail,
  SurveyEmailKind
} from '@/types/survey'
import {
  defaultQuestion,
  emptySurvey,
  estimateMinutes,
  findQuestion,
  makeId,
  touch,
  withEmailDefaults
} from './helpers'

/** How many undo steps to retain. Deep enough to unwind an AI batch. */
const HISTORY_LIMIT = 50

interface State {
  survey: Survey
  past: Survey[]
  future: Survey[]
  /** Latest AI review, cleared whenever the survey changes under it. */
  review: AIReview | null
  selectedQuestionId: string | null
  /** True once a change has been made since the last "save". */
  dirty: boolean
}

type Action =
  | {
      type: 'replace'
      /**
       * An updater is the safe form for an async caller: it composes against
       * whatever the survey is when the action lands, not the snapshot the
       * caller closed over when its request started.
       */
      survey: Survey | ((current: Survey) => Survey)
      keepReview?: boolean
    }
  | { type: 'reset'; survey: Survey }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'select'; questionId: string | null }
  | {
      type: 'setReview'
      review: AIReview | null | ((prev: AIReview | null) => AIReview | null)
    }
  | { type: 'markSaved' }
  | { type: 'addQuestion'; sectionId?: string; questionType: QuestionType }
  | { type: 'updateQuestion'; questionId: string; changes: Partial<Question> }
  | { type: 'deleteQuestion'; questionId: string }
  | { type: 'duplicateQuestion'; questionId: string }
  | { type: 'reorder'; sectionId: string; fromIndex: number; toIndex: number }
  | { type: 'addSection' }
  | { type: 'updateSection'; sectionId: string; title: string }
  | {
      type: 'updateSurvey'
      changes: Partial<Pick<Survey, 'title' | 'description' | 'status'>>
    }
  | {
      type: 'updateEmail'
      kind: SurveyEmailKind
      changes: Partial<Omit<SurveyEmail, 'id' | 'kind'>>
    }

/** Records the current survey into history before applying a change. */
function commit(state: State, next: Survey, keepReview = false): State {
  const withEstimate: Survey = {
    ...withEmailDefaults(next),
    meta: { ...next.meta, estimatedMinutes: estimateMinutes(next) }
  }
  return {
    ...state,
    survey: touch(withEstimate),
    past: [...state.past, state.survey].slice(-HISTORY_LIMIT),
    future: [],
    // Any structural change invalidates the review: a stale issue list
    // pointing at deleted questions is worse than none.
    review: keepReview ? state.review : null,
    dirty: true
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'replace':
      return commit(
        state,
        typeof action.survey === 'function'
          ? action.survey(state.survey)
          : action.survey,
        action.keepReview
      )

    case 'reset':
      return {
        survey: withEmailDefaults(action.survey),
        past: [],
        future: [],
        review: null,
        selectedQuestionId: null,
        dirty: false
      }

    case 'undo': {
      const previous = state.past[state.past.length - 1]
      if (!previous) return state
      return {
        ...state,
        survey: previous,
        past: state.past.slice(0, -1),
        future: [state.survey, ...state.future].slice(0, HISTORY_LIMIT),
        review: null,
        dirty: true
      }
    }

    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return {
        ...state,
        survey: next,
        past: [...state.past, state.survey].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        review: null,
        dirty: true
      }
    }

    case 'select':
      return { ...state, selectedQuestionId: action.questionId }

    case 'setReview':
      return {
        ...state,
        review:
          typeof action.review === 'function'
            ? action.review(state.review)
            : action.review
      }

    case 'markSaved':
      return { ...state, dirty: false }

    case 'addQuestion': {
      const sectionId =
        action.sectionId ??
        state.survey.sections[state.survey.sections.length - 1]?.id
      if (!sectionId) return state
      const question: Question = {
        id: makeId('q'),
        ...defaultQuestion(action.questionType)
      }
      const next: Survey = {
        ...state.survey,
        sections: state.survey.sections.map(s =>
          s.id === sectionId
            ? { ...s, questions: [...s.questions, question] }
            : s
        )
      }
      return {
        ...commit(state, next),
        // Select the new question so the user can type straight into it.
        selectedQuestionId: question.id
      }
    }

    case 'updateQuestion': {
      const found = findQuestion(state.survey, action.questionId)
      if (!found) return state
      const next: Survey = {
        ...state.survey,
        sections: state.survey.sections.map(s => ({
          ...s,
          questions: s.questions.map(q =>
            q.id === action.questionId ? { ...q, ...action.changes } : q
          )
        }))
      }
      // Editing text should not wipe the review — the issue may be the
      // thing being fixed, and losing the panel mid-edit is jarring.
      return commit(state, next, true)
    }

    case 'deleteQuestion': {
      const next: Survey = {
        ...state.survey,
        sections: state.survey.sections.map(s => ({
          ...s,
          questions: s.questions.filter(q => q.id !== action.questionId)
        })),
        logic: state.survey.logic.filter(
          l =>
            l.questionId !== action.questionId &&
            l.targetId !== action.questionId
        )
      }
      return {
        ...commit(state, next),
        selectedQuestionId:
          state.selectedQuestionId === action.questionId
            ? null
            : state.selectedQuestionId
      }
    }

    case 'duplicateQuestion': {
      const found = findQuestion(state.survey, action.questionId)
      if (!found) return state
      const copy: Question = {
        ...found.question,
        id: makeId('q'),
        options: found.question.options?.map(o => ({ ...o, id: makeId('opt') }))
      }
      const next: Survey = {
        ...state.survey,
        sections: state.survey.sections.map(s =>
          s.id === found.section.id
            ? {
                ...s,
                questions: [
                  ...s.questions.slice(0, found.index + 1),
                  copy,
                  ...s.questions.slice(found.index + 1)
                ]
              }
            : s
        )
      }
      return { ...commit(state, next), selectedQuestionId: copy.id }
    }

    case 'reorder': {
      const section = state.survey.sections.find(s => s.id === action.sectionId)
      if (!section) return state
      const questions = [...section.questions]
      const [moved] = questions.splice(action.fromIndex, 1)
      if (!moved) return state
      questions.splice(action.toIndex, 0, moved)
      const next: Survey = {
        ...state.survey,
        sections: state.survey.sections.map(s =>
          s.id === action.sectionId ? { ...s, questions } : s
        )
      }
      return commit(state, next, true)
    }

    case 'addSection': {
      const next: Survey = {
        ...state.survey,
        sections: [
          ...state.survey.sections,
          {
            id: makeId('sec'),
            title: `Section ${state.survey.sections.length + 1}`,
            questions: []
          }
        ]
      }
      return commit(state, next, true)
    }

    case 'updateSection': {
      const next: Survey = {
        ...state.survey,
        sections: state.survey.sections.map(s =>
          s.id === action.sectionId ? { ...s, title: action.title } : s
        )
      }
      return commit(state, next, true)
    }

    case 'updateSurvey':
      return commit(state, { ...state.survey, ...action.changes }, true)

    case 'updateEmail': {
      const emails = state.survey.emails ?? []
      if (!emails.some(e => e.kind === action.kind)) return state
      const next: Survey = {
        ...state.survey,
        emails: emails.map(e =>
          e.kind === action.kind ? { ...e, ...action.changes } : e
        )
      }
      // Email copy has no bearing on question quality, so the review stands.
      return commit(state, next, true)
    }
  }
}

export interface SurveyStore extends State {
  canUndo: boolean
  canRedo: boolean
  dispatch: (action: Action) => void
  /** Convenience helpers so components don't build actions by hand. */
  replaceSurvey: (
    survey: Survey | ((current: Survey) => Survey),
    keepReview?: boolean
  ) => void
  resetSurvey: (survey: Survey) => void
  select: (questionId: string | null) => void
  setReview: (
    review: AIReview | null | ((prev: AIReview | null) => AIReview | null)
  ) => void
  /**
   * Clears the dirty flag after a successful save.
   *
   * Critically this does NOT route through `commit()`: it neither touches
   * `updatedAt` nor pushes history, so the save path cannot re-trigger
   * itself. See lib/survey/autosave-policy.ts.
   */
  markSaved: () => void
  undo: () => void
  redo: () => void
}

const SurveyContext = createContext<SurveyStore | null>(null)

export function SurveyProvider({
  children,
  initialSurvey
}: {
  children: ReactNode
  initialSurvey?: Survey
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    survey: initialSurvey ? withEmailDefaults(initialSurvey) : emptySurvey(),
    past: [],
    future: [],
    review: null,
    selectedQuestionId: null,
    dirty: false
  }))

  const replaceSurvey = useCallback(
    (survey: Survey | ((current: Survey) => Survey), keepReview?: boolean) =>
      dispatch({ type: 'replace', survey, keepReview }),
    []
  )
  const resetSurvey = useCallback(
    (survey: Survey) => dispatch({ type: 'reset', survey }),
    []
  )
  const select = useCallback(
    (questionId: string | null) => dispatch({ type: 'select', questionId }),
    []
  )
  const setReview = useCallback(
    (review: AIReview | null | ((prev: AIReview | null) => AIReview | null)) =>
      dispatch({ type: 'setReview', review }),
    []
  )
  const markSaved = useCallback(() => dispatch({ type: 'markSaved' }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])

  const value = useMemo<SurveyStore>(
    () => ({
      ...state,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      dispatch,
      replaceSurvey,
      resetSurvey,
      select,
      setReview,
      markSaved,
      undo,
      redo
    }),
    [
      state,
      replaceSurvey,
      resetSurvey,
      select,
      setReview,
      markSaved,
      undo,
      redo
    ]
  )

  return (
    <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
  )
}

export function useSurvey(): SurveyStore {
  const store = useContext(SurveyContext)
  if (!store) {
    throw new Error('useSurvey must be used inside a SurveyProvider.')
  }
  return store
}
