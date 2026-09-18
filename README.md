# Survey Copilot

**Build smarter surveys with AI.**

---

## Hackathon Context

Internal Experience.com hackathon project (August 2026). Scope is a
demo-quality MVP focused on a compelling end-to-end story rather than a
production system.

The application supports both:

- **Live AI** using the Anthropic Claude API
- **Mock AI** for reliable demo execution without an API key

This allows the same application to run with real AI when an API key is
available while retaining a reliable fallback for the hackathon demo.

---

## Hackathon Output Card

| Field                      | Details                                                                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name + Role                | Premkumar Arumugam — Senior Developer                                                                                                                                                                 |
| Problem I solved           | Creating and maintaining high-quality Experience.com surveys requires significant manual effort for designing survey structure, writing questions, reviewing question quality, and improving surveys. |
| What I built               | Survey Copilot — an AI-native survey creation and optimization workspace that uses natural language to generate complete surveys and helps users review and improve them.                             |
| Tool used                  | Claude Code + Anthropic Claude API                                                                                                                                                                    |
| Time without AI            | 15 to 30 minutes                                                                                                                                                                                      |
| Time with AI today         | 2 to 5 minutes                                                                                                                                                                                        |
| Will I use this next week? | YES — because it can significantly reduce the effort required to create and improve experience surveys.                                                                                               |
| Where does it live?        | `premkumar-arumugam/survey-copilot`                                                                                                                                                                   |

---

## Product Purpose

Survey Copilot is an AI-native survey creation and validation tool for
Experience.com teams.

Instead of assembling a survey question by question and hoping it is well
designed, a user states an objective in plain language, gets a complete
structured survey, and then uses AI to review, fix, and refine it until it is
ready to publish.

The workflow:

```
CREATE → BUILD → REVIEW → FIX → REFINE → READY
```

Three things it is meant to do well:

- **AI survey creation** — describe an objective, get a structured survey.
- **AI survey validation** — catch double-barrelled, leading, duplicate, and
  confusing questions before they ship.
- **AI survey improvement** — apply suggested fixes and refine the survey by
  describing the change you want.

See [requirements.md](requirements.md) for the full product specification.

---

## Technology Stack

| Concern     | Choice                              |
| ----------- | ----------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)  |
| UI runtime  | React 19                            |
| Language    | TypeScript (strict)                 |
| Styling     | Tailwind CSS v4                     |
| Components  | shadcn/ui                           |
| Animation   | Framer Motion                       |
| Icons       | Lucide (`lucide-react`)             |
| Drag & drop | dnd-kit                             |
| AI          | Anthropic SDK (`@anthropic-ai/sdk`) |
| Formatting  | Prettier (mandatory standard)       |

No database. Survey data lives in React/application state for the MVP;
persistence may be considered later only if needed.

---

## AI Architecture

The frontend never calls Claude directly. All AI access is server-side:

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

Provider code lives in [lib/ai/](lib/ai/) and is **server-only**. Shared
contracts live in [types/ai.ts](types/ai.ts) and [types/survey.ts](types/survey.ts).

All five operations are implemented in both providers and reachable through
one route, `POST /api/ai/[operation]`: `generateSurvey()`, `reviewSurvey()`,
`refineSurvey()`, `applyFix()`, `generateLogic()`. Neither provider mutates
survey state directly — both propose structured operations, which are
validated against the live survey (`lib/survey/operations.ts`) before being
applied.

### Claude / Mock Strategy

Two interchangeable providers sit behind a single `AIProvider` interface and
return **identical structured shapes**, so the UI never branches on which one
answered.

| `AI_PROVIDER` | Behaviour                                       |
| ------------- | ----------------------------------------------- |
| `auto`        | Claude if `ANTHROPIC_API_KEY` is set, else Mock |
| `claude`      | Force Claude (fails explicitly if no key)       |
| `mock`        | Force Mock                                      |

If Claude is configured but a request fails for an infrastructure reason, the
app gracefully falls back to Mock AI. Bad requests and unimplemented operations
are _not_ masked by fallback, so real problems stay visible.

You can check which provider is active at
[`/api/ai/status`](app/api/ai/status/route.ts):

```json
{ "mode": "auto", "active": "mock", "configured": false }
```

**Claude** uses structured outputs (`output_config.format`, model
`claude-opus-5`, streamed) — see [lib/ai/claude-provider.ts](lib/ai/claude-provider.ts),
[lib/ai/claude/schemas.ts](lib/ai/claude/schemas.ts), and
[lib/ai/claude/prompts.ts](lib/ai/claude/prompts.ts). Verified against the
live API: real survey generation, review that finds genuine structural
issues, and natural-language refinement that adds real conditional logic.

**Mock AI** is a full implementation, not a stub: 11 realistic scenarios with
keyword-group intent matching (not exact-string matching — see
[lib/ai/mock/](lib/ai/mock/)), a review engine that computes Survey Health
from issues actually found in the survey, and a refinement engine covering
shortening, lengthening, tone changes, deduplication, question-type changes,
follow-ups, and conditional logic. Run `npm run smoke` for a 27-check
regression pass with no API key required.

---

## Current Status

> **AI-powered survey generation, review, and refinement are working —
> verified end to end in a real browser against the real Claude API,** not
> just typechecked. The project is past the foundation stage and into active
> feature development.

### Implemented

- **Home/Dashboard** — objective composer, template cards, example prompts.
- **Survey Builder** — three-column workspace: question-type palette and
  section list (left) · drag-sortable question canvas with inline editing
  (center, via dnd-kit) · Survey Copilot panel (right).
- **Mock AI provider** — all five operations. 11 realistic scenarios,
  keyword-group intent matching, a real review engine, and a refinement
  engine. `npm run smoke` runs 27 checks against it with no API key.
- **Claude AI provider** — all five operations, using structured outputs
  (model `claude-opus-5`, streamed). `npm run smoke:claude` runs 14 checks
  against the live API.
- **Automatic Claude/Mock selection and fallback** — exercised by real
  traffic through `POST /api/ai/[operation]`, not just the foundation-stage
  status route.
- **AI Survey Generation** — natural-language objective → complete
  structured survey, with a step-by-step generation animation.
- **AI Review + Survey Health** — a live health score (0–100) with an
  animated dial, computed from issues the AI actually found in the survey,
  not a placeholder number.
- **AI Fix** — apply a suggested fix from the review panel; falls back to a
  described natural-language refinement when a fix has no precomputed
  mechanical operation.
- **Natural-language refinement** — "make this shorter," "remove
  duplicates," "if someone rates below 3, ask why," and more, via a Copilot
  chat box and a Cmd/Ctrl+K command palette.
- **Preview** — a local respondent walkthrough (progress, prev/next,
  submit); not a separate app.
- **Publish** — an honest mock: sets the survey to "published" and shows a
  labeled prototype link. No real respondent infrastructure exists, and the
  UI says so.
- Every AI-proposed change is validated against the live survey
  (`lib/survey/operations.ts`) before it is applied — malformed operations
  are rejected with a reason, never silently applied or left to corrupt
  state.

### Planned / Next

- A visual indicator for conditional survey logic in the canvas (the
  underlying `add_logic` operation and natural-language path both work;
  only the canvas-level "IF Q5 < 3 → show Q6" visualization is missing).
- Context-aware per-question Copilot affordance (an inline "✦ Q7 Copilot"
  beyond the existing panel-level issue list).
- A "time saved" / prototype-metrics panel.
- Demo rehearsal and final polish pass.
- `prompt.md` updated with this session's actual prompts.

Nothing above is described as complete unless it has been run and verified —
see `CLAUDE.md`'s session handoff for the specific commands and results.

---

## Local Setup

Requires Node.js 20+ (developed on v22).

```bash
cd survey-copilot
npm install
cp .env.example .env.local   # optional — omit to run on Mock AI
npm run dev
```

Then open <http://localhost:3000>.

### Scripts

| Command                | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Dev server                                      |
| `npm run build`        | Production build                                |
| `npm start`            | Serve the production build                      |
| `npm run lint`         | ESLint                                          |
| `npm run typecheck`    | TypeScript check                                |
| `npm run format`       | Format all files with Prettier                  |
| `npm run format:check` | Verify formatting without writing               |
| `npm run validate`     | format:check + typecheck + lint                 |
| `npm run smoke`        | Mock AI regression suite (no API key needed)    |
| `npm run smoke:claude` | Live Claude regression suite (needs an API key) |

---

## Code Formatting

Prettier is a **mandatory project-wide standard**. All code and supported
project files created or modified in this project must follow the project's
Prettier configuration; alternative formatting styles must not be introduced.

`.prettierrc` is authoritative:

```json
{
  "printWidth": 80,
  "singleQuote": true,
  "trailingComma": "none",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "semi": false,
  "requirePragma": false,
  "proseWrap": "preserve",
  "arrowParens": "avoid"
}
```

In practice: single quotes, **no semicolons**, no trailing commas, 80-column
wrap, and `x => x` arrow params. `prettier-plugin-tailwindcss` sorts Tailwind
utility classes automatically.

Covers TypeScript, TSX, JavaScript, JSX, JSON, CSS, Markdown, and every other
type Prettier supports. Generated and vendored output is excluded via
`.prettierignore`.

```bash
npm run format        # write
npm run format:check  # verify
npm run validate      # format + types + lint
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in as needed.

| Variable            | Required | Default | Description                                               |
| ------------------- | -------- | ------- | --------------------------------------------------------- |
| `AI_PROVIDER`       | No       | `auto`  | `auto` \| `claude` \| `mock` — which provider to use.     |
| `ANTHROPIC_API_KEY` | No       | —       | Server-side only. Leave blank to run entirely on Mock AI. |

**Security:** `ANTHROPIC_API_KEY` is server-side only and must never reach the
browser. `.env`, `.env.local`, and `.env.*.local` are git-ignored; `.env.example`
is tracked and contains no secrets. Never commit an API key or put one in
documentation.

---

## Documentation

| File                               | Role                                             |
| ---------------------------------- | ------------------------------------------------ |
| [requirements.md](requirements.md) | Product specification — what to build            |
| [CLAUDE.md](CLAUDE.md)             | Persistent development context + session handoff |
| [prompt.md](prompt.md)             | Prompt log and AI prompt templates               |
