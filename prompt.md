# Survey Copilot — Prompts

This file documents the prompts used to build Survey Copilot and the prompt
templates the product itself will send to Claude.

Two kinds of prompt live here, kept separate on purpose:

- **Development prompts** (§1–2) — what was asked of Claude Code to build the
  project.
- **Product prompt templates** (§3–7) — the prompts the _application_ will send
  to Claude at runtime, once AI operations are implemented.

> The actual Claude Code conversation will be exported separately. Nothing in
> this file is a transcript, and no future conversations are invented here.
>
> **Never put a real API key in this file.**

---

## 1. Foundation / Setup Prompt

**Status:** used — this session (2026-08-25).

The foundation session established the project skeleton only, explicitly _not_
the product features. Substance of the request:

- Create the project inside `survey-copilot/`; inspect and reuse the folder if
  it already exists; don't delete useful files.
- Set up Next.js, TypeScript, App Router, Tailwind CSS, shadcn/ui, Framer
  Motion, Lucide icons, dnd-kit, and the Anthropic SDK.
- No MongoDB and no database — survey data lives in React/application state for
  the MVP.
- Prepare a dual AI architecture with `AI_PROVIDER=auto`: use Claude when
  `ANTHROPIC_API_KEY` exists, Mock AI when it does not, and fall back to Mock
  when a Claude request fails. Both providers must eventually return the same
  structured response format.
- Scaffold `lib/ai/provider.ts`, `lib/ai/claude-provider.ts`,
  `lib/ai/mock-provider.ts` with clean interfaces/types, and keep the frontend
  from ever calling Claude directly.
- Prepare foundational types in `types/survey.ts` and `types/ai.ts`
  (Survey, Section, Question, QuestionType, SurveyLogic, AIReview, AIOperation).
- Create `.env.example` with `AI_PROVIDER=auto` and an empty
  `ANTHROPIC_API_KEY`; ensure `.env`, `.env.local`, `.env.*.local` are
  git-ignored; keep the key out of all documentation and source.
- Author `requirements.md` (product spec), `CLAUDE.md` (persistent dev context,
  incl. a multi-session handoff protocol), `README.md`, and this `prompt.md`.
- Run `npm install`, then the TypeScript check, lint, and production build; fix
  setup errors; don't claim validation passed without running it.
- Do **not** implement the actual Survey Copilot product features, and do not
  make real Claude API calls during the session.

**Outcome:** foundation complete; TypeScript, lint, and build all pass; the AI
status route verified as resolving to the Mock provider with no key present. See
the handoff section of `CLAUDE.md`.

---

## 2. Product-Development Prompt

**Status:** placeholder — next session.

The next session begins actual feature development. It should open with the
standard multi-session preamble from `CLAUDE.md`:

1. Read `CLAUDE.md`.
2. Read `requirements.md` and treat it as the product specification.
3. Inspect project structure, git status, and relevant source files.
4. Determine the current implementation state.
5. Continue from the existing implementation; do not rebuild completed work.

Intended first slice (per the handoff): Home/Dashboard + Empty Builder shell,
`MockProvider.generateSurvey()` with intent-matched scenarios, a
`POST /api/ai/generate` route using `withFallback()`, and the builder rendering
the generated survey from React state.

_To be filled in as sessions happen._

---

## 3. AI Generation Prompt

**Status:** placeholder — not implemented.

**Operation:** `generateSurvey({ objective, maxQuestions? })` →
`GenerateSurveyResult`

**Intent:** turn a natural-language objective into a complete structured survey.

**Example user input:**

> "Create a post-purchase customer experience survey. Measure satisfaction,
> delivery experience, product quality, customer support and likelihood to
> recommend. Keep it under 5 minutes."

**Template sketch:**

```text
[System]
You are a survey design expert for Experience.com. Produce well-structured
experience surveys that avoid double-barrelled, leading, and duplicate
questions. Return only structured data matching the provided schema.

[User]
Objective: {objective}
Question limit: {maxQuestions | "no hard limit"}

Produce a survey with:
- a concise title and description
- logical sections
- an appropriate question type per question ({QuestionType} values)
- answer options / scale labels where the type needs them
- an estimated completion time consistent with any stated constraint
```

**Response contract:** a `Survey` (see `types/survey.ts`), wrapped in
`AIResult<GenerateSurveyResult>`.

_Exact prompt text to be finalised during implementation._

---

## 4. AI Review Prompt

**Status:** placeholder — not implemented.

**Operation:** `reviewSurvey({ survey })` → `ReviewSurveyResult`

**Intent:** score survey health and enumerate quality issues with fixes.

**Issue types to detect** (`ReviewIssueType`): double-barrelled, leading,
duplicate, confusing wording, poor answer choices, unnecessary question,
excessive length, missing follow-up.

**Template sketch:**

```text
[System]
You are a survey quality reviewer. Identify concrete, actionable problems.
Anchor every issue to the question id it concerns. Do not invent issues; if the
survey is sound, say so and score it accordingly.

[User]
Survey: {survey as JSON}

Return:
- health: overall score 0-100 plus clarity, structure, length, coverage
  sub-scores and a one-line summary
- issues: for each — type, severity, questionId, message, rationale, and one or
  more suggested fixes with before/after text
```

**Response contract:** `AIReview` — `SurveyHealth` + `AIReviewIssue[]`, each
issue carrying `AIFixSuggestion[]`.

_Exact prompt text to be finalised during implementation._

---

## 5. AI Fix Prompt

**Status:** placeholder — not implemented.

**Operation:** `applyFix({ survey, issueId, fixId })` → `SurveyMutationResult`

**Intent:** apply one specific previously-suggested fix and report what changed.

**Example — splitting a double-barrelled question:**

Before:

> "How satisfied are you with our product and customer service?"

After:

> "How satisfied are you with our product?"
>
> "How satisfied are you with our customer service?"

**Template sketch:**

```text
[System]
Apply exactly the requested fix. Change nothing else. Preserve question ids for
questions you do not modify.

[User]
Survey: {survey as JSON}
Fix to apply: {issue + selected fix}

Return the updated survey and a short list of the changes you made.
```

**Response contract:** `SurveyMutationResult` — updated `Survey` plus a
`changes: string[]` summary so the mutation is reviewable rather than opaque.

_Exact prompt text to be finalised during implementation._

---

## 6. Refinement Prompt

**Status:** placeholder — not implemented.

**Operations:** `refineSurvey({ survey, instruction })` → `SurveyMutationResult`
and `generateLogic({ survey, instruction })` → `GenerateLogicResult`

**Intent:** let the user steer the survey conversationally.

**Example instructions:**

- "Make this survey shorter."
- "Make the wording more professional."
- "Remove duplicate questions."
- "Change Q5 to a 1–10 rating."
- "Add a follow-up question for dissatisfied customers."
- "If someone gives a rating below 3, ask why." → routes to `generateLogic()`

**Template sketch:**

```text
[System]
Apply the user's instruction to the survey. Make the smallest change that fully
satisfies it. Preserve ids for untouched questions. Never silently drop content
the instruction did not ask you to remove.

[User]
Survey: {survey as JSON}
Instruction: {instruction}

Return the updated survey and a list of the changes you made.
```

For `generateLogic()` the response is `SurveyLogic[]` rules (flat
when/operator/value → action/target form) plus any questions that had to be
added, e.g. the follow-up itself.

_Exact prompt text to be finalised during implementation._

---

## 7. Testing / Review Prompt

**Status:** placeholder — not implemented.

Intended use once features land:

- **Provider parity:** verify Claude and Mock return the same shapes for the
  same request, so the UI cannot tell them apart.
- **Mock intent matching:** confirm several phrasings of the same request
  resolve to the right scenario, and that nothing depends on one exact
  hardcoded sentence.
- **Fallback behaviour:** simulate a Claude failure and confirm graceful Mock
  fallback — and confirm `invalid_request` / `not_implemented` are _not_ masked.
- **Security review:** confirm `lib/ai/*` is never imported client-side and that
  `ANTHROPIC_API_KEY` never appears in client bundles or serialised output.
- **Demo rehearsal:** walk the ten-step demo flow in `requirements.md`
  end-to-end with no API key configured.
- **Validation gate:** TypeScript check, lint, and production build before
  declaring a session done.

_To be filled in as sessions happen._
