'use client'

/**
 * The centre column: survey title, section groups, and drag-sortable
 * question cards.
 */

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { QuestionCard } from '@/components/builder/question-card'
import { Badge } from '@/components/ui/badge'
import { useSurvey } from '@/lib/survey/store'
import type { AIReviewIssue } from '@/types/ai'

export function SurveyCanvas() {
  const { survey, review, selectedQuestionId, select, dispatch } = useSurvey()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const issuesByQuestion = new Map<string, AIReviewIssue[]>()
  for (const issue of review?.issues ?? []) {
    if (!issue.questionId) continue
    const list = issuesByQuestion.get(issue.questionId) ?? []
    list.push(issue)
    issuesByQuestion.set(issue.questionId, list)
  }

  const totalQuestions = survey.sections.reduce(
    (n, s) => n + s.questions.length,
    0
  )

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const onDragEnd = (sectionId: string) => (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    const section = survey.sections.find(s => s.id === sectionId)
    if (!section) return
    const fromIndex = section.questions.findIndex(q => q.id === active.id)
    const toIndex = section.questions.findIndex(q => q.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    dispatch({ type: 'reorder', sectionId, fromIndex, toIndex })
  }

  // Section start numbers, computed up front rather than mutated during
  // render — a running counter that survives across map() iterations is an
  // impurity React can legitimately re-run or discard mid-render.
  const sectionStartNumbers = new Map<string, number>()
  {
    let running = 0
    for (const section of survey.sections) {
      sectionStartNumbers.set(section.id, running + 1)
      running += section.questions.length
    }
  }

  const activeQuestion = activeId
    ? survey.sections.flatMap(s => s.questions).find(q => q.id === activeId)
    : null

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-8">
      <div>
        <input
          value={survey.title}
          onChange={e =>
            dispatch({
              type: 'updateSurvey',
              changes: { title: e.target.value }
            })
          }
          placeholder="Untitled Survey"
          className="w-full bg-transparent text-[26px] leading-tight font-semibold tracking-tight outline-none placeholder:opacity-40"
        />
        <textarea
          value={survey.description ?? ''}
          onChange={e =>
            dispatch({
              type: 'updateSurvey',
              changes: { description: e.target.value }
            })
          }
          placeholder="Tell respondents what this survey is about."
          rows={1}
          className="text-muted-foreground mt-1 w-full resize-none bg-transparent text-sm outline-none placeholder:opacity-50"
        />

        <div className="mt-3 flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {survey.sections.length} Section
            {survey.sections.length === 1 ? '' : 's'}
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {totalQuestions} Question{totalQuestions === 1 ? '' : 's'}
          </Badge>
          {survey.meta.estimatedMinutes && (
            <Badge variant="secondary" className="font-normal">
              ~{survey.meta.estimatedMinutes} min
            </Badge>
          )}
        </div>
      </div>

      {survey.sections.map(section => {
        const startNumber = sectionStartNumbers.get(section.id) ?? 1

        return (
          <section key={section.id} className="flex flex-col gap-3">
            <input
              value={section.title}
              onChange={e =>
                dispatch({
                  type: 'updateSection',
                  sectionId: section.id,
                  title: e.target.value
                })
              }
              className="text-brand w-fit bg-transparent text-xs font-semibold tracking-wide uppercase outline-none"
            />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd(section.id)}
            >
              <SortableContext
                items={section.questions.map(q => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence initial={false}>
                  {section.questions.map((question, i) => (
                    <motion.div
                      key={question.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="mb-3"
                    >
                      <QuestionCard
                        question={question}
                        number={startNumber + i}
                        selected={selectedQuestionId === question.id}
                        issues={issuesByQuestion.get(question.id) ?? []}
                        onSelect={() => select(question.id)}
                        onChangeText={text =>
                          dispatch({
                            type: 'updateQuestion',
                            questionId: question.id,
                            changes: { text }
                          })
                        }
                        onToggleRequired={() =>
                          dispatch({
                            type: 'updateQuestion',
                            questionId: question.id,
                            changes: { required: !question.required }
                          })
                        }
                        onDuplicate={() =>
                          dispatch({
                            type: 'duplicateQuestion',
                            questionId: question.id
                          })
                        }
                        onDelete={() =>
                          dispatch({
                            type: 'deleteQuestion',
                            questionId: question.id
                          })
                        }
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SortableContext>

              <DragOverlay>
                {activeQuestion ? (
                  <div className="border-brand bg-card rounded-xl border p-4 opacity-90 shadow-2xl">
                    <p className="text-[15px] font-medium">
                      {activeQuestion.text}
                    </p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'addQuestion',
                  sectionId: section.id,
                  questionType: 'short_text'
                })
              }
              className="border-input text-muted-foreground hover:border-brand/60 hover:bg-brand/15 hover:text-brand flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5 text-sm transition-colors"
            >
              <Plus className="size-3.5" />
              Add Question Here
            </button>
          </section>
        )
      })}

      <button
        type="button"
        onClick={() => dispatch({ type: 'addSection' })}
        className="text-muted-foreground hover:text-brand-bright self-start text-xs font-medium"
      >
        + Add Section
      </button>
    </div>
  )
}
