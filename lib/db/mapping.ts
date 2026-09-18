/**
 * Survey Copilot — row mapping.
 *
 * Pure projections between a Survey and its database row. Deliberately NOT
 * marked `server-only`, unlike the rest of lib/db: these functions touch no
 * credentials and no client, so keeping them importable lets the smoke suite
 * assert the mapping without a database or a browser.
 */

import type { Survey, SurveyStatus, SurveySummary } from '@/types/survey'

/** The row shape written to Postgres. */
export interface SurveyRow {
  id: string
  title: string
  status: string
  data: Survey
  created_at: string
  updated_at: string
}

/**
 * Projects a Survey onto its row.
 *
 * `title` and `status` are duplicated out of `data` purely so the list query
 * can avoid reading the JSONB; `data` remains the source of truth.
 */
export function surveyToRow(survey: Survey): SurveyRow {
  return {
    id: survey.id,
    title: survey.title?.trim() || 'Untitled Survey',
    status: survey.status,
    data: survey,
    created_at: survey.createdAt,
    updated_at: survey.updatedAt
  }
}

/** Projects a listing row onto the summary the dashboard renders. */
export function rowToSummary(row: {
  id: string
  title: string | null
  status: string | null
  updated_at: string
}): SurveySummary {
  return {
    id: row.id,
    title: row.title?.trim() || 'Untitled Survey',
    status: (row.status ?? 'draft') as SurveyStatus,
    updatedAt: row.updated_at
  }
}
