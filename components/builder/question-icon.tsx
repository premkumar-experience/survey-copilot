import {
  Calendar,
  CheckSquare,
  Circle,
  ChevronDownSquare,
  Gauge,
  ToggleLeft,
  Type,
  AlignLeft
} from 'lucide-react'

import type { QuestionType } from '@/types/survey'

/** Icon shown on each question card's type badge. */
export const QUESTION_TYPE_ICONS: Record<QuestionType, typeof Type> = {
  short_text: Type,
  long_text: AlignLeft,
  single_select: Circle,
  multi_select: CheckSquare,
  dropdown: ChevronDownSquare,
  rating: Gauge,
  nps: Gauge,
  boolean: ToggleLeft,
  date: Calendar
}
