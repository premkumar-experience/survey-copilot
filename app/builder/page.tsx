/**
 * /builder — the main Survey Builder workspace.
 *
 * Three-column layout: tools (left) · canvas (center) · Copilot (right),
 * per requirements.md's core workflow. Client-only below this thin server
 * wrapper, since survey state and the AI panel both need interactivity.
 */

import { BuilderWorkspace } from './builder-workspace'

export default function BuilderPage() {
  return <BuilderWorkspace />
}
