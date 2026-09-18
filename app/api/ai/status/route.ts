/**
 * GET /api/ai/status
 *
 * Reports which AI provider is active. This is the reference example of the
 * server-side boundary: the browser learns *that* Claude is configured, never
 * the key. Product operations will follow the same pattern under /api/ai/.
 */

import { NextResponse } from 'next/server'

import { getAIStatus } from '@/lib/ai'

export async function GET() {
  return NextResponse.json(getAIStatus())
}
