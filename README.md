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

| Field                      | Details                                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name + Role                | Premkumar Arumugam — Senior Developer                                                                                                                                                                                                                                                |
| Problem I solved           | Creating and maintaining high-quality Experience.com surveys requires significant manual effort for designing survey structure, writing questions, reviewing question quality, and improving surveys.                                                                                |
| What I built               | Survey Copilot — an AI-native survey workspace: describe an objective in plain language to generate a complete structured survey, review it for quality issues, apply fixes, refine it conversationally, and generate invitation and reminder emails written from the survey itself. |
| Tool used                  | Claude Code + Anthropic Claude API                                                                                                                                                                                                                                                   |
| Time without AI            | 15 to 30 minutes                                                                                                                                                                                                                                                                     |
| Time with AI today         | 2 to 5 minutes                                                                                                                                                                                                                                                                       |
| Will I use this next week? | YES — because it can significantly reduce the effort required to create and improve experience surveys.                                                                                                                                                                              |
| Where does it live?        | `premkumar-arumugam/survey-copilot`                                                                                                                                                                                                                                                  |

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
| Components  | shadcn/ui (Base UI under the hood)  |
| Animation   | Framer Motion                       |
| Icons       | Lucide (`lucide-react`)             |
| Drag & drop | dnd-kit                             |
| AI          | Anthropic SDK (`@anthropic-ai/sdk`) |
| Storage     | Supabase (`@supabase/supabase-js`)  |
| Formatting  | Prettier (mandatory standard)       |

**No ORM and no migration tooling** — one `surveys` table holding whole
`Survey` documents in a JSONB column ([supabase/schema.sql](supabase/schema.sql),
run by hand in the SQL editor). React state stays the source of truth for the
survey being edited; Supabase is a write-behind store.

Storage is **optional**. With no Supabase environment variables the app runs
entirely in memory, exactly as it did before persistence existed — the same
way Mock AI covers a missing API key.

---

## Project Structure

```
survey-copilot/
  proxy.ts                  the auth gate — runs before every route
  app/
    page.tsx                Home / Dashboard
    surveys/                "My Surveys" — every saved survey
    login/                  the sign-in page
    builder/                Survey Builder workspace
      builder-workspace.tsx client shell: step state, autosave, handoff
      [id]/                 reopen a saved survey (server-loaded)
    api/ai/[operation]/     single POST boundary for all six operations
    api/surveys/            REST CRUD for saved surveys
    api/auth/               login, logout, status
  components/
    ui/                     shadcn/ui primitives (Base UI under the hood)
    builder/                canvas, question cards, Copilot panel, dialogs,
                            command palette, step nav, email editor, publish
    app-sidebar.tsx         desktop nav · mobile-nav.tsx is its drawer form
  lib/
    ai/                     provider layer (SERVER-ONLY) — Claude + Mock
    db/                     Supabase storage (SERVER-ONLY)
    survey/                 state, undo/redo, operation validation, autosave
  types/                    Survey / AI contracts, shared by both providers
  scripts/                  smoke-mock.mts (no key) · smoke-claude.mts (key)
  supabase/schema.sql       run by hand in the SQL editor
```

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

All six operations are implemented in both providers and reachable through
one route, `POST /api/ai/[operation]`: `generateSurvey()`, `reviewSurvey()`,
`refineSurvey()`, `applyFix()`, `generateLogic()`, and `generateEmails()`.
Neither provider mutates survey state directly — both propose structured
operations, which are validated against the live survey
([lib/survey/operations.ts](lib/survey/operations.ts)) before being applied.

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
follow-ups, and conditional logic. Email copy is derived from the survey
itself — its topic, real question count, estimated length and lead question —
so it reads as written for _that_ survey rather than a template. Run
`npm run smoke` for a 49-check regression pass with no API key and no
database required.

---

## Storage Architecture

Surveys survive a refresh and reopen from the dashboard.

```
Browser → /api/surveys[/id] → lib/db/surveys.ts → Supabase (Postgres)
```

- **One table, whole-document reads and writes.** `id` is `text`, not `uuid`,
  because the app mints `svy_…` ids client-side — reusing them keeps the
  upsert idempotent with no second identity. `title` and `status` are
  extracted columns so the list query never reads the JSONB.
- **Server-only.** [lib/db/](lib/db/) starts with `import 'server-only'`, so
  an accidental client import is a _build_ error rather than a leaked key.
  `lib/db/mapping.ts` is the exception — pure projections, no credentials, so
  the smoke suite can assert them.
- **RLS is on with no policies.** The anon key can read and write nothing;
  only the server's service role gets through.
- **No auth on the data itself.** Shared workspace: everyone who can sign in
  sees every survey, and two tabs on one survey is last-write-wins.

### Autosave

Debounced 1.5s, with the decision extracted pure into
[lib/survey/autosave-policy.ts](lib/survey/autosave-policy.ts) so it can be
asserted by the smoke suite. Three rules carry the design:

1. **The save trigger is a content fingerprint that excludes `updatedAt`.**
   Every edit touches the timestamp, so fingerprinting the content is what
   stops an infinite save loop. The smoke suite asserts that a survey
   differing only by `updatedAt` fingerprints identically.
2. **The save path never dispatches through `commit()`.** Writing a server
   response back into survey state would commit → touch → save, forever.
3. **Saves pause while AI operations run**, so intermediate states are not
   persisted.

---

## Access Control

Optional, and off by default. Set `AUTH_USERNAME` and `AUTH_PASSWORD` to put
the whole app behind a login; leave them blank and it runs open, which is
fine locally but not on a public deployment.

- **One shared username/password**, held in env vars. Deliberately _not_ a
  user system — no accounts, no signup, no per-user data. If the project ever
  needs to know _who_ is signed in, this should be replaced with Supabase
  Auth rather than extended.
- **The session cookie is an HMAC signature** (`httpOnly`, `sameSite=lax`,
  seven days), so it cannot be forged without the secret.
- **[proxy.ts](proxy.ts) is the enforcement point.** Next.js 16 renamed the
  `middleware` file convention to `proxy`; it runs before every route, so an
  unauthenticated request never reaches a page or the Anthropic key. Only
  `/login` and the auth endpoints are public, so a route added later is
  gated by default.
- **Page requests redirect to `/login?from=…`; API requests get a 401 JSON
  body** instead, because handing `fetch()` an HTML login page surfaces as a
  confusing parse error rather than "signed out".

> **Deploying publicly?** Set `AUTH_USERNAME` and `AUTH_PASSWORD` for **every**
> environment that serves the app, not just production. Where they are absent
> the gate disables itself and the deployment is fully open, with a spendable
> Anthropic key behind it.

---

## Current Status

> **The full `CREATE → BUILD → REVIEW → FIX → REFINE → READY` loop works,
> plus AI-written emails, Supabase persistence and an optional login —
> verified against the real Claude API and a real database,** not just
> typechecked.

### Implemented

- **Home/Dashboard** — objective composer, template cards, example prompts,
  and recent saved surveys.
- **Survey Builder** — a three-step flow, `QUESTIONS → EMAILS → PUBLISH`,
  with a stepper in the top bar. Steps are always clickable rather than
  gated: this is an authoring tool, and revising questions after reading the
  email is normal.
- **Three-column workspace** — question-type palette and section list
  (left) · drag-sortable question canvas with inline editing (center, via
  dnd-kit) · Survey Copilot panel (right).
- **Emails step** — AI-written invitation and reminder copy, generated
  automatically once questions exist, with subject, preheader, greeting,
  body, CTA, sign-off and sender editable beside a live inbox preview, plus
  a per-email natural-language "ask for a change". Emails live on the
  `Survey` itself, so one upsert saves everything and undo/redo covers email
  edits like any other change.
- **Saved surveys** — surveys persist to Supabase, reopen from the dashboard
  at `/builder/[id]`, and are listed at `/surveys`. Autosave is debounced and
  pauses during AI operations.
- **Access control** — optional shared-credential login with an HMAC session
  cookie, enforced in `proxy.ts` before any route renders.
- **Mock AI provider** — all six operations. 11 realistic scenarios,
  keyword-group intent matching, a real review engine, and a refinement
  engine. `npm run smoke` runs 49 checks against it with no API key and no
  database.
- **Claude AI provider** — all six operations, using structured outputs
  (model `claude-opus-5`, streamed). `npm run smoke:claude` exercises
  generation, review and refinement against the live API.
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
- **Light theme, blue accent, Apple system font.** Elevation is a three-level
  system — tinted canvas, white panels and cards, blue question cards. Light
  mode is forced rather than following `prefers-color-scheme`, because there
  is no in-app toggle yet; the `.dark` tokens stay defined and dormant.
- **Responsive down to tablet, with a phone-usable dashboard and preview.**
  The sidebar collapses into a drawer below `lg`; the builder's tool palette
  hides below `lg` and the Copilot becomes a slide-in overlay below `xl`,
  staying mounted so its conversation and current review survive the
  transition. Touch drag-and-drop is a known gap — see below.
- Every AI-proposed change is validated against the live survey
  ([lib/survey/operations.ts](lib/survey/operations.ts)) before it is applied
  — malformed operations are rejected with a reason, never silently applied
  or left to corrupt state.

### Known Gaps

- **Touch drag-and-drop.** The question canvas registers only dnd-kit's
  `PointerSensor` with a 4px activation distance, so reordering questions on
  a touch screen competes with scrolling. Reorder on a desktop viewport;
  fixing it properly means a `TouchSensor` with a delay constraint or an
  explicit drag handle.
- **Conditional logic has no visual indicator.** The `add_logic` operation
  and the natural-language path to it both work, but the canvas has no
  "IF Q5 < 3 → SHOW Q6" representation.
- The dashboard search input and the user avatar are non-functional.
- `npm run format:check` fails on the generated `AGENTS.md` (Prettier cannot
  parse its ASCII art). Every source file passes; do not reformat that file.
- `npm run smoke:claude` needs `ANTHROPIC_API_KEY` **exported in the shell** —
  standalone scripts do not read `.env.local` the way `next dev` does.
- One pre-existing lint _warning_ (not an error) in
  `components/builder/command-palette.tsx`.

### Planned / Next

- Context-aware per-question Copilot affordance (an inline "✦ Q7 Copilot"
  beyond the existing panel-level issue list).
- A "time saved" / prototype-metrics panel.
- Demo rehearsal and final polish pass.
- `prompt.md` updated with the email prompts.

Nothing above is described as complete unless it has been run and verified —
see `CLAUDE.md`'s session handoff for the specific commands and results.

---

## Local Setup

Requires Node.js 20+ (developed on v22).

```bash
cd survey-copilot
npm install
cp .env.example .env.local   # optional — omit to run on Mock AI, in memory
npm run dev
```

Then open <http://localhost:3000>.

Everything works with an empty `.env.local`: Mock AI answers every operation,
surveys live in React state for the session, and there is no login. Fill in
the variables below to turn on live Claude, persistence, or access control
independently of one another.

To persist surveys, run [supabase/schema.sql](supabase/schema.sql) by hand in
the Supabase SQL editor first — there is no migration tooling.

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
  "arrowParens": "avoid",
  "plugins": ["prettier-plugin-tailwindcss"]
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

Every variable is optional. With none of them set the app runs entirely on
Mock AI, in memory, with no login — which is exactly how it is meant to demo
on a machine with no credentials.

| Variable                    | Default | Description                                                             |
| --------------------------- | ------- | ----------------------------------------------------------------------- |
| `AI_PROVIDER`               | `auto`  | `auto` \| `claude` \| `mock` — which provider to use.                   |
| `ANTHROPIC_API_KEY`         | —       | Server-side only. Leave blank to run entirely on Mock AI.               |
| `AUTH_USERNAME`             | —       | Set with `AUTH_PASSWORD` to require a login. Blank ⇒ the app runs open. |
| `AUTH_PASSWORD`             | —       | The other half of the shared credential.                                |
| `AUTH_SECRET`               | —       | Signs the session cookie. Defaults to `AUTH_PASSWORD` when unset.       |
| `SUPABASE_URL`              | —       | Set with the service role key to persist surveys. Blank ⇒ in-memory.    |
| `SUPABASE_SERVICE_ROLE_KEY` | —       | Server-side only. Bypasses row-level security.                          |

**Security.** `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
server-side only and must never reach the browser — note that neither is
`NEXT_PUBLIC_*`. The service role key is the more dangerous of the two
because it bypasses row-level security entirely, which is why
[lib/db/](lib/db/) is marked `server-only` and the smoke suite asserts that
nothing under `components/` or `lib/survey/` imports it. Only non-secret
state reaches the browser: the provider status (mode, active provider,
`configured`) and a `persisted` boolean.

`.env`, `.env.local`, and `.env.*.local` are git-ignored; `.env.example` is
tracked and contains no secrets. Never commit a key or put one in
documentation.

---

## Documentation

| File                                       | Role                                             |
| ------------------------------------------ | ------------------------------------------------ |
| [requirements.md](requirements.md)         | Product specification — what to build            |
| [CLAUDE.md](CLAUDE.md)                     | Persistent development context + session handoff |
| [prompt.md](prompt.md)                     | Prompt log and AI prompt templates               |
| [supabase/schema.sql](supabase/schema.sql) | The one table, run by hand in the SQL editor     |
