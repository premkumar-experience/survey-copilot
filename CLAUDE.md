@AGENTS.md

# Survey Copilot — Development Context

This file is the persistent development instruction/context for Claude Code.

- **`requirements.md` is the product specification.** Read it before
  implementing any product feature.
- **`CLAUDE.md` (this file) is the persistent development instruction/context.**
- **The codebase is the implementation source of truth.**

> `AGENTS.md` is generated and re-added by `next dev`. It warns that Next.js 16
> has breaking changes vs. older training data — consult
> `node_modules/next/dist/docs/` before writing framework code. Leave it in
> place.

---

## Project Overview

Survey Copilot is an AI-native survey creation and validation tool for
Experience.com teams. A user describes a survey objective in plain language and
gets a complete structured survey, then uses AI to review, fix, and refine it
until it is ready to publish.

Tagline: **Build smarter surveys with AI.**

## Hackathon Context

Internal Experience.com hackathon project. Scope is a demo-quality MVP, not a
production system. Optimise for a compelling end-to-end demo of AI survey
creation, validation, and improvement over completeness or infrastructure.

The demo must work **without an API key** — the Mock AI provider exists so the
project can be demoed on any machine.

## Product Objective

AI survey creation + AI survey validation + AI survey improvement.

The core workflow: `CREATE → BUILD → REVIEW → FIX → REFINE → READY`.

See `requirements.md` for the full feature list, examples, and non-goals.

## Technology Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **shadcn/ui** (`components/ui/`, `components.json`, New York style)
- **Framer Motion** — animation
- **Lucide** (`lucide-react`) — icons
- **dnd-kit** — drag-and-drop question/section reordering
- **Anthropic SDK** (`@anthropic-ai/sdk`) — Claude access, server-side only
- **Supabase** (`@supabase/supabase-js`) — survey storage, server-side only
- **Prettier** (+ `prettier-plugin-tailwindcss`) — mandatory formatting standard

**No ORM and no migration tooling** — one `surveys` table holding whole
`Survey` documents in a JSONB column (`supabase/schema.sql`). React state
remains the source of truth for the survey being edited; Supabase is a
write-behind store. Storage is **optional**: with no env vars the app runs
entirely in memory, exactly as it did before persistence existed.

## Architecture

```
survey-copilot/
  app/
    page.tsx                Home/Dashboard (recent surveys + templates)
    surveys/                "My Surveys" — every saved survey
    builder/                Survey Builder workspace
      builder-workspace.tsx client shell: step state, autosave, handoff
      [id]/                 reopen a saved survey (server-loaded)
    api/ai/[operation]/     single POST boundary, routes through withFallback
    api/ai/status/          provider status (mode/active/configured only)
    api/surveys/            REST CRUD for saved surveys
  components/
    ui/                     shadcn/ui primitives (Base UI under the hood)
    builder/                canvas, question cards, Copilot panel, dialogs,
                             command palette, step nav, email editor,
                             publish step
    survey-list.tsx         saved-survey cards (dashboard + /surveys)
  lib/
    ai/                     AI provider layer (SERVER-ONLY)
      index.ts              getAI(), withFallback(), getAIStatus()
      provider.ts           AIProvider interface + resolution rules
      claude-provider.ts    structured outputs, streamed, claude-opus-5
      claude/               JSON schemas + prompts for Claude
      mock-provider.ts
      mock/                 scenarios, matching, review, refine, build, emails
      client.ts             browser-side client — the only way UI calls AI
    db/                     Supabase storage (SERVER-ONLY, `import 'server-only'`)
      supabase.ts           lazy client; null when unconfigured
      surveys.ts            list/get/upsert/delete, never throws
      mapping.ts            pure row projections (NOT server-only, so testable)
    survey/
      store.tsx             React state + undo/redo reducer
      operations.ts         validates every AI-proposed change before apply
      use-autosave.ts       debounced saves — read its header before editing
      autosave-policy.ts    the pure "should I save?" decision
      client.ts             browser-side storage client
      steps.ts              Questions → Emails → Publish
      helpers.ts, handoff.ts
    utils.ts                cn() helper from shadcn
  types/
    survey.ts               Survey, Section, Question, SurveyEmail, ...
    ai.ts                   AIReview, SurveyOperation union, envelope types
  scripts/
    smoke-mock.mts          49-check regression harness, no API key or DB
    smoke-claude.mts        live-API check (requires ANTHROPIC_API_KEY)
  supabase/schema.sql       run by hand in the Supabase SQL editor
  public/
```

Data flow — the frontend must **never** call Claude directly:

```
Browser
  ↓
Next.js
  ↓
Server-side API route
  ↓
AI Provider
  ↓
Claude OR Mock
  ↓
Structured JSON
  ↓
React Survey State
```

## AI Architecture

Two interchangeable providers behind one interface (`AIProvider` in
`lib/ai/provider.ts`). Both return **identical structured shapes**, so the UI
never branches on which one answered.

Provider selection, driven by `AI_PROVIDER` (default `auto`):

| `AI_PROVIDER` | Behaviour                                       |
| ------------- | ----------------------------------------------- |
| `auto`        | Claude if `ANTHROPIC_API_KEY` is set, else Mock |
| `claude`      | Force Claude (fails explicitly if no key)       |
| `mock`        | Force Mock                                      |

Graceful degradation: `withFallback()` in `lib/ai/index.ts` retries on Mock when
a Claude call fails for an infrastructure reason. It deliberately does **not**
fall back on `invalid_request` or `not_implemented` — those fail identically on
both providers, and substituting mock data there would hide the real bug. Route
operations through `withFallback()` so degradation is consistent app-wide.

All six operations are implemented in both providers and verified working:

- `generateSurvey()` — objective → complete survey
- `reviewSurvey()` — survey → health score + issues + suggested fixes
- `refineSurvey()` — survey + instruction → updated survey
- `applyFix()` — survey + issue/fix id (+ operations) → updated survey
- `generateLogic()` — survey + instruction → conditional logic rules
- `generateEmails()` — survey (+ optional kinds/instruction) → invitation and
  reminder emails, written from the survey's own subject matter and length

Claude uses structured outputs (`output_config.format`, model `claude-opus-5`,
streamed) rather than tool use — see `lib/ai/claude/schemas.ts` and
`lib/ai/claude/prompts.ts`. Mock matches intent via keyword-group scoring
across 11 realistic scenarios (`lib/ai/mock/scenarios.ts`), not exact strings.
Every operation from either provider is validated through
`lib/survey/operations.ts` before it touches survey state — the AI never
mutates the survey directly; it proposes `SurveyOperation`s, and malformed
ones are rejected with a reason instead of corrupting state.

## Security

- `ANTHROPIC_API_KEY` is **server-side only**. Never import `lib/ai/*` into a
  client component, and never expose the key via `NEXT_PUBLIC_*`, props, or
  serialised server-component output.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-side only** and is strictly more
  dangerous: it bypasses row-level security entirely. `lib/db/*` therefore
  starts with `import 'server-only'`, which turns an accidental client import
  into a build error. The smoke suite also asserts that nothing under
  `components/` or `lib/survey/` imports it.
- The `surveys` table has RLS **on with no policies**, so the anon key can
  read and write nothing. Never add a `using (true)` policy — that would make
  the table world-writable.
- Only non-secret state may reach the browser: `getAIStatus()` (mode, active
  provider, `configured`) and a `configured` / `persisted` boolean from the
  survey routes. Never the keys themselves.
- `.env`, `.env.local`, and `.env.*.local` are git-ignored. `.env.example` is
  tracked and must stay key-free.
- Never commit secrets. Never put a real key in `CLAUDE.md`, `README.md`,
  `requirements.md`, `prompt.md`, or source code.

## UI/UX Direction

- Clean, calm, product-grade. It should look like a real Experience.com tool.
- The AI's reasoning should be visible and reviewable — show what changed and
  why, never mutate the survey opaquely.
- Survey Health is the emotional core of the demo: the user watches the score
  improve as fixes are applied. Animate score and issue transitions
  (Framer Motion) so progress is felt.
- Prefer shadcn/ui primitives over bespoke components; use Lucide for icons.
- Empty states matter — the empty builder is the demo's entry point.
- **Light theme, blue accent, Apple system font.** Forced light: light mode
  applies regardless of `prefers-color-scheme`, because there is no in-app
  toggle. `.dark` tokens stay defined but dormant.
- **Use the tokens in `app/globals.css`, never literal colours.** Elevation is
  a three-level system — tinted canvas (`--background`), white panels and
  cards, blue question cards. Note `--brand-bright` means _more vivid_ in
  light mode, not lighter.
- **Anything on a blue question card is inverted**: white or translucent-white
  text, badges and controls (`.on-brand-control`). A tinted fill that works on
  white will disappear there. Check contrast when adding to that surface.

## Code Formatting (MANDATORY)

> **All code and supported project files created or modified in this project
> must follow the project's Prettier configuration. Do not introduce
> alternative formatting styles.**

This is a hard project-wide standard, not a preference. Prettier is the single
source of truth for formatting; `.prettierrc` is authoritative.

Active configuration (`.prettierrc`):

| Option            | Value        | Effect                                 |
| ----------------- | ------------ | -------------------------------------- |
| `printWidth`      | `80`         | Wrap at 80 columns                     |
| `singleQuote`     | `true`       | `'single'`, not `"double"`             |
| `trailingComma`   | `"none"`     | No trailing commas                     |
| `bracketSpacing`  | `true`       | `{ a: 1 }`, not `{a: 1}`               |
| `bracketSameLine` | `false`      | Closing `>` on its own line            |
| `semi`            | `false`      | **No** statement semicolons            |
| `requirePragma`   | `false`      | Format every file, no pragma needed    |
| `proseWrap`       | `"preserve"` | Leave Markdown line breaks as authored |
| `arrowParens`     | `"avoid"`    | `x => x`, not `(x) => x`               |

`prettier-plugin-tailwindcss` is enabled, so Tailwind utility classes are
sorted automatically — write classes in any order and let Prettier normalise
them.

Rules for every session:

1. Write new code in this style from the start — single quotes, no semicolons,
   no trailing commas, 80 columns.
2. Run `npm run format` after editing, or `npm run format:check` to verify.
3. Never hand-format against Prettier, and never add a competing formatter
   config (`.editorconfig` formatting keys, ESLint stylistic rules, IDE-specific
   overrides).
4. `npm run validate` runs format check + typecheck + lint together — use it as
   the pre-handoff gate.
5. Applies to **all** supported file types: `.ts`, `.tsx`, `.js`, `.jsx`,
   `.mjs`, `.json`, `.css`, `.md`, and anything else Prettier supports.
6. `.prettierignore` covers generated/vendored output (`.next`, `node_modules`,
   `package-lock.json`, `next-env.d.ts`, `AGENTS.md`). Don't format those.

**Caution with `semi: false`:** a line beginning with `(`, `[`, `` ` ``, `+`,
`-`, `/`, or a regex literal can be swallowed by ASI and silently join the
previous line. Prefix such a line with a leading semicolon (`;[1, 2].forEach(…)`)
— Prettier does this automatically, so don't remove one it inserts.

## Development Principles

1. **Read `requirements.md` before implementing product features.**
2. Next.js 16 differs from older training data — check
   `node_modules/next/dist/docs/` before writing framework code.
3. Keep the two providers behaviourally interchangeable. Any shape change must
   land in `types/ai.ts` and in both providers.
4. Types first: extend `types/survey.ts` / `types/ai.ts` before wiring UI.
5. No auth and no ORM. Storage must stay optional — every feature has to work
   with no Supabase configured, the way Mock AI covers a missing API key.
6. Don't claim validation passed without running it. Don't mark features
   complete when they are stubs.
7. Keep the repo clean; no misleading or backdated commits.
8. **Follow the project Prettier configuration for every file you create or
   modify.** See "Code Formatting (MANDATORY)" above.

## Requirements Reference

- `requirements.md` — product specification (what to build)
- `README.md` — project overview, setup, current stage
- `prompt.md` — prompt log / prompt templates for AI operations

---

## Hackathon Output Card

`README.md` must contain the Hackathon Output Card.

At the end of the hackathon, update it using actual information from the
hackathon.

**Known values — these should remain as-is:**

| Field               | Value                                 |
| ------------------- | ------------------------------------- |
| Name + Role         | Premkumar Arumugam — Senior Developer |
| Tool used           | Claude Code                           |
| Where does it live? | premkumar-arumugam/survey-copilot     |

**Must remain placeholders (`[To be completed]`) until the hackathon is
complete:**

- Problem I solved
- What I built
- Time without AI
- Time with AI today
- Will I use this next week?

**Do NOT fabricate:**

- Time without AI
- Time with AI
- Problem/outcome
- Adoption decision
- Features that were not actually implemented

Use the actual hackathon results when finalizing the README. Until then, leave
the placeholders untouched — a plausible-looking estimate is worse than an
honest blank, because the card is a factual record of what the hackathon
produced. In particular, "What I built" must reflect only features actually
implemented and verified, never planned or stubbed ones.

---

## Multi-Session Development

This project spans multiple Claude Code sessions. Do not depend on previous chat
history as the only source of context.

**At the START of every session:**

1. Read `CLAUDE.md`.
2. Read `requirements.md`.
3. Inspect project structure.
4. Inspect git status.
5. Inspect relevant source files.
6. Determine current implementation state.
7. Continue from the existing implementation.
8. Do not rebuild completed functionality.

**At the END of every session:** update the handoff section below.

---

## Current Session Handoff

_Last updated: 2026-09-18 — Emails step, Supabase persistence, and a light
theme redesign._

Three substantial changes since the last checkpoint: the builder became a
three-step flow with a new **Emails** step, surveys now **persist to
Supabase**, and the whole UI moved from dark-purple to a **light blue/white
theme** in the Apple system font.

### Completed

**Prior sessions:** foundation (Next.js 16, TS strict, Tailwind v4,
shadcn/ui, dnd-kit, Anthropic SDK, Prettier) and the full
`CREATE → BUILD → REVIEW → FIX → REFINE → READY` loop with both AI providers.
See git history — not repeated here.

**Three-step creation flow — `QUESTIONS → EMAILS → PUBLISH`.**
A stepper in the top bar (`components/builder/step-nav.tsx`,
`lib/survey/steps.ts`) swaps the canvas per step. Steps are always clickable
rather than gated: this is an authoring tool, and revising questions after
reading the email is normal. The top bar carries step navigation only, so
there is never a second Publish button.

**Emails step — a sixth AI operation.** `generateEmails` is implemented in
both providers and returns identical shapes:

- `types/survey.ts` gained `SurveyEmail` / `SurveyEmailKind`, and `Survey`
  gained `emails: SurveyEmail[]`.
- Emails flow through the same validation boundary as everything else via a
  new `set_email` operation — an upsert keyed on `kind`, so there is at most
  one invitation and one reminder, always in send order.
- Claude uses a new `EMAILS_SCHEMA` + `EMAIL_WRITER_SYSTEM` prompt.
- Mock (`lib/ai/mock/emails.ts`) derives copy from the survey itself — topic,
  real question count, estimated minutes, lead question — so it reads as
  written for _this_ survey, not a template. Verified: an employee survey
  says "your experience working here", an NPS one quotes the NPS question.
- Emails generate **automatically** once questions exist, so arriving at the
  step finds real copy already there.
- `components/builder/email-editor.tsx` edits subject, preheader, greeting,
  body, CTA, sign-off and sender beside a live inbox preview, plus a
  per-email natural-language "ask for a change".

**Supabase persistence.** Surveys survive a refresh and reopen from the
dashboard. See "Storage Architecture" below for the design and its rules.

**Light theme + Apple system font.** `app/globals.css` was rebuilt: neutral
grays with a blue brand accent, true elevation (tinted canvas, white panels,
blue question cards), and blue-tinted shadows. The Geist webfonts were
dropped for the `-apple-system` stack. Light mode is forced app-wide —
`prefers-color-scheme` is deliberately NOT honoured, because there is no
in-app toggle yet; the `.dark` tokens remain defined and dormant for when one
is added. All contrast pairings were checked against WCAG AA (body text
~17:1, muted ~8:1, brand ~5.5:1).

**Question cards are blue.** `.card-question` carries the same gradient as
the "Add Question" button, so the object matches the control that creates it.
Everything on that surface — number badge, type pill, Required badge, answer
controls (`.on-brand-control`) — is inverted to white or translucent white.
The Preview dialog renders questions the same way, so previewing looks like
the survey you just built.

### Storage Architecture

No ORM, no migrations — one table, whole-document reads and writes.

```
Browser → /api/surveys[/id] → lib/db/surveys.ts → Supabase (Postgres)
```

- **Schema** (`supabase/schema.sql`, run by hand in the SQL editor): one
  `surveys` row per survey. `id` is `text`, not `uuid`, because the app mints
  `svy_…` ids client-side — reusing them keeps the upsert idempotent with no
  second identity. `title`/`status` are extracted columns so the list query
  never reads the JSONB. RLS is **on with no policies**: anon keys read
  nothing, and only the server's service role gets through. Never add
  `using (true)`.
- **Server-only.** `lib/db/*` starts with `import 'server-only'`, so an
  accidental client import is a _build_ error rather than a leaked key.
  `lib/db/mapping.ts` is the exception — pure projections, no credentials, so
  the smoke suite can assert them.
- **No auth.** Shared workspace: everyone sees every survey. Two tabs on one
  survey is last-write-wins.
- **Optional.** With no env vars the app runs entirely in memory, exactly as
  before persistence existed. `POST /api/surveys` answers `200` with
  `persisted: false` rather than an error, and the client latches off for the
  session — one wasted request, not one per debounce.

#### Autosave — read this before touching it

Debounced 1.5s (`lib/survey/use-autosave.ts`), with the decision extracted
pure into `lib/survey/autosave-policy.ts` so the smoke suite can assert it.
Three rules, each load-bearing:

1. **The trigger is a content fingerprint that excludes `updatedAt`.**
   `commit()` calls `touch()` on every change, so the survey's identity churns
   on every keystroke. Fingerprinting the content makes that invisible. The
   smoke suite asserts a survey differing only by `updatedAt` fingerprints
   identically — that check is the guard against an infinite save loop.
2. **The save path never dispatches through `commit()`.** `markSaved` is the
   only permitted dispatch, and it must stay non-committing. Writing a server
   response back into survey state would commit → touch → save, forever.
3. **Saves pause while AI operations run** (`suspended`), so intermediate
   `replaceSurvey` states are not persisted.

Also handled: a new survey id aborts the previous survey's in-flight save
(generation mints a fresh id via `resetSurvey`, which sets `dirty: false` —
without this a generated survey would never persist); empty shells are not
saved, so visiting `/builder` does not litter the dashboard; and the URL
swaps to `/builder/<id>` via `replaceState` on first save, which does not
remount the tree the way `router.replace` would.

### Pending

- **Survey logic has no visual indicator.** The `add_logic` operation and the
  natural-language path to it both work, but there is no "IF Q5 < 3 → SHOW
  Q6" representation in the canvas. Deferred by the user.
- Context-aware per-question Copilot (§22) — the panel surfaces per-question
  issues, but there is no inline "✦ Q7 Copilot" affordance.
- Metrics / "time saved" panel (§29) — not started.
- Demo rehearsal (§31) — not started.
- `prompt.md` has not been updated with the email prompts.
- `README.md` mentions persistence but its Hackathon Output Card is still
  placeholders, per the rules above — leave it that way until the hackathon
  ends.

### Known Issues

- One pre-existing lint **warning** (not an error) in
  `components/builder/command-palette.tsx`: the keydown effect omits `close`
  from its dependency array. Lint exits 0.
- `npm run format:check` fails on the generated `AGENTS.md` (Prettier chokes
  on its ASCII art). All source files pass; do not reformat that file.
- `npm run smoke:claude` needs `ANTHROPIC_API_KEY` **exported in the shell** —
  standalone scripts do not read `.env.local` the way `next dev` does.
- The dashboard search input and the user avatar are still non-functional.

### Important Decisions

Carried forward: no ORM, provider abstraction, `AIResult<T>` envelope,
selective fallback, server-only AI layer, Prettier as mandatory. New this
session:

- **Emails live on the `Survey`**, not in a side table, so one upsert saves
  everything and undo/redo covers email edits like any other change.
- **`AnswerPreview`'s `interactive` prop governs enablement only**, not
  surface styling. It used to do both; once Preview also adopted the blue
  card, conflating them would have rendered Preview's inputs unreadable.
- **`/builder/[id]` rather than `/builder?id=`** — a new dynamic segment
  leaves `/builder` statically prerendered and every existing link working.
- **`SurveyProvider`'s `initialSurvey` prop finally has a caller.** It existed
  unused; the saved-survey route passes the server-loaded survey into it.
- **`replaceSurvey` accepts an updater function.** Both email flows called it
  after an `await` with a stale snapshot, which silently reverted question
  edits made during the request. Updaters compose against current state.
- **Light mode is forced, not `prefers-color-scheme`.** Following the OS
  would strand dark-mode users in a theme with no way out until a toggle
  exists.

### Files/Areas Changed

New: `lib/db/{supabase,surveys,mapping}.ts` · `app/api/surveys/{route,[id]}` ·
`lib/survey/{client,use-autosave,autosave-policy,steps}.ts` ·
`app/builder/[id]/page.tsx` · `app/surveys/page.tsx` ·
`components/survey-list.tsx` · `components/builder/{email-editor,
publish-step,step-nav,canvas-skeleton}.tsx` · `lib/ai/mock/emails.ts` ·
`supabase/schema.sql`

Modified: `types/{survey,ai}.ts` (emails, `SurveySummary`, `set_email`) ·
`lib/survey/{store,operations,helpers}.ts` · both providers +
`lib/ai/claude/{schemas,prompts}.ts` · `app/api/ai/[operation]/route.ts` ·
`app/globals.css` (full theme rebuild) · `app/layout.tsx` (fonts) ·
`app/page.tsx` · most of `components/builder/*` · `scripts/smoke-mock.mts`

### Validation

Actually run at this checkpoint:

- **TypeScript:** PASS (exit 0)
- **Lint:** PASS (0 errors, 1 pre-existing warning)
- **Build:** PASS — 9 routes
- **Mock AI + storage regression:** PASS (`npm run smoke`, 49 checks, up from
  27; includes the autosave-loop guard and a leak check that no client file
  imports `lib/db/supabase`)
- **Live Claude:** PASS — `generateEmails` verified against the real API;
  copy named the survey's actual driver options and true length
- **Live Supabase:** PASS — save → list → load (emails intact) → upsert
  without duplicating → delete, plus `/builder/[id]` 200 and a bad id 404
- **Degradation:** PASS — with no Supabase env vars, all routes 200, the
  dashboard falls back to templates, `/surveys` explains itself
- **Tests:** NOT RUN (no framework; the smoke scripts are the suite)
