# Survey Copilot

**Build smarter surveys with AI.**

This is the **product requirements document** — it describes what Survey Copilot
is supposed to do. It is the product specification: read it before implementing
any feature. `CLAUDE.md` holds persistent development instructions; the codebase
is the implementation source of truth.

---

## Product Vision

Survey Copilot is an AI-native survey creation and validation tool designed for
Experience.com teams.

Instead of assembling a survey question by question and hoping it is well
designed, a user states an objective in plain language, gets a complete
structured survey, and then uses AI to review, fix, and refine it until it is
ready to publish.

---

## Problem

Creating and maintaining high-quality experience surveys can require manual
effort around:

- Understanding survey objectives
- Designing survey structure
- Writing questions
- Selecting question types
- Creating answer options
- Reviewing survey quality
- Finding duplicate questions
- Finding confusing or biased questions
- Improving wording
- Improving survey length
- Creating follow-up questions
- Creating basic survey logic

Each of these is a place where survey quality quietly degrades. Poorly worded
questions produce unusable data, and the cost of that is only discovered after
responses come in. Survey Copilot moves quality review to _before_ publish.

---

## Core Workflow

```
CREATE
  ↓
BUILD
  ↓
REVIEW
  ↓
FIX
  ↓
REFINE
  ↓
READY
```

The builder presents this as three steps:

```
QUESTIONS  →  EMAILS  →  PUBLISH
```

The CREATE → REFINE loop above all happens inside the **Questions** step.
**Emails** covers the copy that invites people to the survey, and **Publish**
is the final review before it goes out.

---

## Core Features

1. **Natural Language Survey Generation** — describe an objective, get a survey.
2. **Survey Builder** — view and edit sections, questions, types, and options.
3. **AI Survey Review** — analyse the survey and report quality issues.
4. **Survey Health** — an at-a-glance quality score with sub-scores.
5. **AI Suggested Fixes** — a concrete proposed change per issue.
6. **Apply AI Fixes** — accept a fix and mutate the survey.
7. **Natural Language Refinement** — change the survey by describing the change.
8. **Context-aware Copilot** — a copilot that knows the current survey state.
9. **Simple Survey Logic** — basic conditional show/skip/follow-up rules.
10. **Preview** — see the survey as a respondent would.
11. **Publish UI** — the final ready-to-publish state.

---

## AI Generation

Example input:

> "Create a post-purchase customer experience survey. Measure satisfaction,
> delivery experience, product quality, customer support and likelihood to
> recommend. Keep it under 5 minutes."

Expected result:

A complete structured survey — title, sections, questions with appropriate
types, answer options, and an estimated completion time consistent with the
stated constraint.

---

## AI Review

The AI should identify issues such as:

- Double-barrelled questions
- Leading questions
- Duplicate questions
- Confusing wording
- Poor answer choices
- Unnecessary questions
- Excessive survey length
- Missing follow-up opportunities

Each issue carries a severity, an explanation of why it matters, and one or more
suggested fixes. Issues are anchored to the question they concern so the builder
can highlight them in place.

---

## Survey Health

An aggregate 0–100 score plus sub-scores for clarity, structure, length, and
coverage, with a short summary headline. Health is what makes review progress
legible: the user fixes issues and watches the score improve.

---

## AI Fix

The user must be able to apply suggested fixes.

Example — splitting a double-barrelled question:

**Before**

> "How satisfied are you with our product and customer service?"

**After**

> "How satisfied are you with our product?"
>
> "How satisfied are you with our customer service?"

Applying a fix returns the updated survey plus a description of what changed, so
the change is reviewable rather than opaque.

---

## Natural Language Refinement

The user should be able to steer the survey conversationally:

- "Make this survey shorter."
- "Make the wording more professional."
- "Remove duplicate questions."
- "Change Q5 to a 1–10 rating."
- "Add a follow-up question for dissatisfied customers."
- "If someone gives a rating below 3, ask why."

Refinement operates on the whole current survey and returns the updated survey
with a summary of the changes made.

---

## Simple Survey Logic

Basic conditional rules only — a flat list of `when <question> <operator>
<value> then <action>` rules supporting show, hide, skip-to-section, and
end-survey. Deliberately not a rules engine (see Non-Goals).

---

## Mock AI

The Mock AI must eventually support realistic natural-language scenarios and
return the same structured response format as Claude, so the entire product —
and the demo — works with no API key.

Critically, the Mock AI **should not depend on one exact hardcoded sentence**. It
should support multiple natural-language variations for common survey scenarios,
matching on intent rather than exact string equality, with a sensible generic
fallback when nothing matches well.

---

## Claude AI

When `ANTHROPIC_API_KEY` is available, Claude should handle arbitrary
natural-language survey generation, review, refinement, and structured
operations — the open-ended cases a fixture library cannot cover.

Both providers satisfy the same interface and return the same structured shapes,
so the UI never branches on which one answered.

---

## Non-Goals

Do **not** prioritize:

- Full respondent platform
- Advanced analytics
- Enterprise authentication
- Complex permissions
- Complete survey response management
- Complex rules engine
- Production-scale infrastructure

The hackathon should focus on:

**AI survey creation + AI survey validation + AI survey improvement**

For the MVP, survey data lives in React/application state. There is no database.
Persistence can be considered later only if needed.

---

## Hackathon Demo Flow

1. Describe survey objective
2. Generate survey with AI
3. Show survey builder
4. Review survey with AI
5. Show Survey Health
6. Identify problems
7. Apply AI fixes
8. Refine survey using natural language
9. Preview
10. Show final ready-to-publish survey
