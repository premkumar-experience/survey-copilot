/**
 * Survey Copilot — AI entry point.
 *
 * FOUNDATION ONLY. Selection and fallback wiring is in place; the underlying
 * operations are still stubs.
 *
 * SERVER-ONLY. Import this from route handlers / server actions only — it
 * touches ANTHROPIC_API_KEY.
 *
 * Usage (once operations are implemented):
 *
 *   import { getAI } from '@/lib/ai';
 *   const result = await getAI().generateSurvey({ objective });
 *   if (!result.ok) { ... }
 */

import type { AIProviderName, AIResult } from '@/types/ai'
import { ClaudeProvider } from './claude-provider'
import { MockProvider } from './mock-provider'
import {
  type AIProvider,
  getProviderMode,
  hasApiKey,
  resolveProviderName
} from './provider'

export type { AIProvider } from './provider'
export { getProviderMode, hasApiKey, resolveProviderName } from './provider'
export { ClaudeProvider } from './claude-provider'
export { MockProvider } from './mock-provider'

/** Returns the provider selected by AI_PROVIDER + key presence. */
export function getAI(): AIProvider {
  return resolveProviderName() === 'claude'
    ? new ClaudeProvider()
    : new MockProvider()
}

/**
 * Runs `op` on the resolved provider and, when that was Claude and the call
 * failed for an infrastructure reason, retries once on Mock.
 *
 * `invalid_request` and `not_implemented` are NOT retried — a bad request or a
 * missing feature fails the same way on both providers, and silently
 * substituting mock data there would hide the real problem.
 *
 * Wire operations through this helper so the whole app degrades consistently
 * when Claude is unavailable.
 */
export async function withFallback<T>(
  op: (provider: AIProvider) => Promise<AIResult<T>>
): Promise<AIResult<T>> {
  const primary = getAI()
  const result = await op(primary)

  if (result.ok || primary.name !== 'claude') return result
  if (result.error.code === 'invalid_request') return result
  if (result.error.code === 'not_implemented') return result

  const fallback = await op(new MockProvider())
  return fallback.ok ? { ...fallback, fellBack: true } : result
}

/** Non-secret provider state, safe to expose to the client for a status badge. */
export interface AIStatus {
  mode: ReturnType<typeof getProviderMode>
  active: AIProviderName
  /** Whether a key is configured — never the key itself. */
  configured: boolean
}

export function getAIStatus(): AIStatus {
  return {
    mode: getProviderMode(),
    active: resolveProviderName(),
    configured: hasApiKey()
  }
}
