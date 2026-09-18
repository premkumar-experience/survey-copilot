module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/app/api/ai/[operation]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
/**
 * POST /api/ai/[operation]
 *
 * The single server-side boundary between the browser and the AI providers.
 * The client never sees ANTHROPIC_API_KEY and never chooses a provider — it
 * posts an operation plus its payload and receives structured JSON.
 *
 *   Browser → Next.js route → withFallback → Claude | Mock → JSON → React
 *
 * Every operation goes through withFallback(), so a Claude outage degrades to
 * Mock rather than breaking the demo.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/ai/index.ts [app-route] (ecmascript) <locals>");
;
;
/** Operations reachable from the client. */ const OPERATIONS = new Set([
    'generateSurvey',
    'reviewSurvey',
    'refineSurvey',
    'applyFix',
    'generateLogic',
    'generateEmails'
]);
function bad(message, status = 400) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: false,
        error: {
            code: 'invalid_request',
            message
        }
    }, {
        status
    });
}
async function POST(request, { params }) {
    // Next 16: route params are async.
    const { operation } = await params;
    if (!OPERATIONS.has(operation)) {
        return bad(`Unknown operation "${operation}".`, 404);
    }
    let body;
    try {
        body = await request.json();
    } catch  {
        return bad('Request body must be JSON.');
    }
    const op = operation;
    // Shape-check here so providers can assume a well-formed request.
    if (op === 'generateSurvey' && !body.objective?.trim()) {
        return bad('Describe what you want to learn to generate a survey.');
    }
    if (op !== 'generateSurvey' && !body.survey) {
        return bad('A survey is required for this operation.');
    }
    if ((op === 'refineSurvey' || op === 'generateLogic') && !body.instruction?.trim()) {
        return bad('Tell me what you would like to change.');
    }
    if (op === 'applyFix' && !body.issueId) {
        return bad('An issueId is required to apply a fix.');
    }
    // One union type across all five operations: the route is a pass-through,
    // so it does not need to know which payload shape it is forwarding.
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["withFallback"])((provider)=>{
        switch(op){
            case 'generateSurvey':
                return provider.generateSurvey({
                    objective: body.objective,
                    ...body.maxQuestions ? {
                        maxQuestions: body.maxQuestions
                    } : {}
                });
            case 'reviewSurvey':
                return provider.reviewSurvey({
                    survey: body.survey
                });
            case 'refineSurvey':
                return provider.refineSurvey({
                    survey: body.survey,
                    instruction: body.instruction
                });
            case 'applyFix':
                return provider.applyFix({
                    survey: body.survey,
                    issueId: body.issueId,
                    fixId: body.fixId ?? '',
                    ...body.operations?.length ? {
                        operations: body.operations
                    } : {}
                });
            case 'generateLogic':
                return provider.generateLogic({
                    survey: body.survey,
                    instruction: body.instruction
                });
            case 'generateEmails':
                return provider.generateEmails({
                    survey: body.survey,
                    ...body.kinds?.length ? {
                        kinds: body.kinds
                    } : {},
                    ...body.instruction?.trim() ? {
                        instruction: body.instruction
                    } : {}
                });
        }
    });
    if (!result.ok) {
        // 502 for upstream trouble, 400 for a request we can't serve.
        const status = result.error.code === 'invalid_request' || result.error.code === 'not_implemented' ? 400 : 502;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: result.error,
            provider: result.provider
        }, {
            status
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true,
        provider: result.provider,
        ...result.fellBack ? {
            fellBack: true
        } : {},
        data: result.data
    });
}
}),
"[project]/lib/ai/claude-provider.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CLAUDE_MAX_TOKENS",
    ()=>CLAUDE_MAX_TOKENS,
    "CLAUDE_MODEL",
    ()=>CLAUDE_MODEL,
    "ClaudeProvider",
    ()=>ClaudeProvider
]);
/**
 * Survey Copilot — Claude AI provider.
 *
 * SERVER-ONLY. Never import this from a client component.
 *
 * Uses structured outputs (`output_config.format`) so Claude returns validated
 * JSON directly — no prose parsing, no tool-use round-trip. Everything Claude
 * proposes still passes through lib/survey/operations.ts, which validates ids
 * and shapes against the live survey: a schema guarantees shape, not that a
 * questionId refers to a question that exists.
 *
 * Every failure resolves as `ok: false` rather than throwing, so withFallback()
 * can degrade to the Mock provider and keep the demo alive.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@anthropic-ai/sdk/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/@anthropic-ai/sdk/client.mjs [app-route] (ecmascript) <export Anthropic as default>");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/survey.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/survey/helpers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/survey/operations.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$build$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/mock/build.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$schemas$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/claude/schemas.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/claude/prompts.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
const CLAUDE_MODEL = 'claude-opus-5';
const CLAUDE_MAX_TOKENS = 16000;
/**
 * Interactive UI, so latency is capped rather than left to hang the panel —
 * but generously: Opus 5 reasoning over a full survey regularly needs more
 * than a minute, and a premature timeout would drop to Mock for no reason.
 */ const REQUEST_TIMEOUT_MS = 180_000;
class ClaudeProvider {
    name = 'claude';
    /** Created lazily so importing this module never requires a key. */ client = null;
    getClient() {
        if (!this.client) {
            this.client = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__["default"]({
                apiKey: process.env.ANTHROPIC_API_KEY,
                timeout: REQUEST_TIMEOUT_MS,
                maxRetries: 1
            });
        }
        return this.client;
    }
    /**
   * One structured-output request. Returns parsed JSON or a typed AIError —
   * never throws, so callers can fall back cleanly.
   */ async ask(system, prompt, format) {
        if (!process.env.ANTHROPIC_API_KEY?.trim()) {
            return {
                ok: false,
                error: {
                    code: 'missing_api_key',
                    message: 'ANTHROPIC_API_KEY is not set.'
                }
            };
        }
        try {
            // Streamed so a long reasoning pass cannot trip an HTTP idle timeout;
            // the final message is awaited, so callers still see one JSON payload.
            const stream = this.getClient().messages.stream({
                model: CLAUDE_MODEL,
                max_tokens: CLAUDE_MAX_TOKENS,
                system,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                output_config: {
                    format
                }
            });
            const response = await stream.finalMessage();
            // A safety refusal is a legitimate outcome, not a crash.
            if (response.stop_reason === 'refusal') {
                return {
                    ok: false,
                    error: {
                        code: 'invalid_response',
                        message: 'Claude declined this request.'
                    }
                };
            }
            const text = response.content.filter((b)=>b.type === 'text').map((b)=>b.text).join('');
            if (!text.trim()) {
                return {
                    ok: false,
                    error: {
                        code: 'invalid_response',
                        message: 'Claude returned an empty response.'
                    }
                };
            }
            try {
                return {
                    ok: true,
                    data: JSON.parse(text)
                };
            } catch  {
                return {
                    ok: false,
                    error: {
                        code: 'invalid_response',
                        message: 'Claude returned malformed JSON.'
                    }
                };
            }
        } catch (err) {
            return {
                ok: false,
                error: toAIError(err)
            };
        }
    }
    async generateSurvey(req) {
        const objective = (req.objective ?? '').trim();
        if (!objective) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'Describe what you want to learn to generate a survey.'
                }
            };
        }
        const result = await this.ask(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_DESIGNER_SYSTEM"], (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateSurveyPrompt"])(objective, req.maxQuestions), __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$schemas$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_SCHEMA"]);
        if (!result.ok) {
            return {
                ok: false,
                provider: this.name,
                error: result.error
            };
        }
        const survey = hydrateSurvey(result.data, objective);
        if (!survey) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_response',
                    message: 'Claude returned a survey with no usable questions.'
                }
            };
        }
        return {
            ok: true,
            provider: this.name,
            data: {
                survey,
                steps: [
                    ...__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$build$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GENERATION_STEPS"]
                ]
            }
        };
    }
    async reviewSurvey(req) {
        if (!req.survey) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'No survey to review.'
                }
            };
        }
        const result = await this.ask(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_REVIEWER_SYSTEM"], (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["reviewSurveyPrompt"])(req.survey), __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$schemas$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REVIEW_SCHEMA"]);
        if (!result.ok) {
            return {
                ok: false,
                provider: this.name,
                error: result.error
            };
        }
        const review = hydrateReview(result.data, req.survey);
        return {
            ok: true,
            provider: this.name,
            data: {
                review
            }
        };
    }
    async refineSurvey(req) {
        const instruction = (req.instruction ?? '').trim();
        if (!req.survey || !instruction) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'Tell me what you would like to change.'
                }
            };
        }
        const result = await this.ask(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_EDITOR_SYSTEM"], (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["refinePrompt"])(req.survey, instruction), __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$schemas$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["OPERATIONS_SCHEMA"]);
        if (!result.ok) {
            return {
                ok: false,
                provider: this.name,
                error: result.error
            };
        }
        const operations = asOperations(result.data.operations);
        if (!operations.length) {
            return {
                ok: true,
                provider: this.name,
                data: {
                    survey: req.survey,
                    changes: result.data.note ? [
                        result.data.note
                    ] : [
                        'No changes were needed.'
                    ],
                    operations: []
                }
            };
        }
        const { survey, outcomes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyOperations"])(req.survey, operations);
        const changes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appliedChanges"])(outcomes);
        return {
            ok: true,
            provider: this.name,
            data: {
                survey,
                // Prefer Claude's own phrasing when every operation applied.
                changes: changes.length ? result.data.changes?.length ? result.data.changes : changes : [
                    'Nothing could be applied to this survey.'
                ],
                operations: outcomes
            }
        };
    }
    /**
   * Applies a fix from a prior review.
   *
   * The client sends the operations it already has from the review that
   * surfaced this issue (see ApplyFixRequest) — review issue/fix ids are
   * minted per run and differ between providers, so this never tries to
   * re-look-up the issue server-side. When the client has no operations for
   * a fix (a structural suggestion with no mechanical translation), it
   * should call refineSurvey with the issue described instead of this.
   */ async applyFix(req) {
        if (!req.survey) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'No survey to fix.'
                }
            };
        }
        if (!req.operations?.length) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'No operations were provided for this fix.'
                }
            };
        }
        const { survey, outcomes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyOperations"])(req.survey, req.operations);
        return {
            ok: true,
            provider: this.name,
            data: {
                survey,
                changes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appliedChanges"])(outcomes),
                operations: outcomes
            }
        };
    }
    async generateLogic(req) {
        const instruction = (req.instruction ?? '').trim();
        if (!req.survey || !instruction) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'Describe the rule you want, e.g. "if Q1 is below 3, ask why".'
                }
            };
        }
        const refined = await this.refineSurvey({
            survey: req.survey,
            instruction
        });
        if (!refined.ok) return refined;
        return {
            ok: true,
            provider: this.name,
            data: {
                survey: refined.data.survey,
                logic: refined.data.survey.logic,
                changes: refined.data.changes,
                operations: refined.data.operations
            }
        };
    }
    async generateEmails(req) {
        if (!req.survey) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'No survey to write emails for.'
                }
            };
        }
        const kinds = req.kinds?.length ? req.kinds : [
            ...__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_EMAIL_KINDS"]
        ];
        const instruction = req.instruction?.trim();
        const result = await this.ask(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EMAIL_WRITER_SYSTEM"], (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateEmailsPrompt"])(req.survey, kinds, instruction), __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2f$schemas$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EMAILS_SCHEMA"]);
        if (!result.ok) {
            return {
                ok: false,
                provider: this.name,
                error: result.error
            };
        }
        const operations = emailOperationsFrom(result.data, kinds);
        if (!operations.length) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_response',
                    message: 'Claude returned no usable emails.'
                }
            };
        }
        const { survey, outcomes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyOperations"])(req.survey, operations);
        const changes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appliedChanges"])(outcomes);
        if (!changes.length) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_response',
                    message: 'The generated emails were malformed.'
                }
            };
        }
        return {
            ok: true,
            provider: this.name,
            data: {
                survey,
                emails: survey.emails,
                // Prefer Claude's own one-line summaries; fall back to the engine's.
                changes: result.data.changes?.length ? result.data.changes : changes
            }
        };
    }
}
/**
 * Turns Claude's email payload into `set_email` operations.
 *
 * Emails of an unrequested kind are dropped — asking for a reminder and
 * getting an unsolicited thank-you would silently add copy the user never
 * asked for. The operations engine still validates each one.
 */ function emailOperationsFrom(payload, kinds) {
    const wanted = new Set(kinds);
    const out = [];
    for (const e of payload.emails ?? []){
        if (typeof e.kind !== 'string' || !wanted.has(e.kind)) continue;
        if (!e.subject?.trim() || !e.body?.length) continue;
        out.push({
            operation: 'set_email',
            email: {
                kind: e.kind,
                subject: e.subject,
                body: e.body,
                ctaLabel: e.ctaLabel?.trim() || 'Start the survey',
                ...e.preheader ? {
                    preheader: e.preheader
                } : {},
                ...e.greeting ? {
                    greeting: e.greeting
                } : {},
                ...e.signOff ? {
                    signOff: e.signOff
                } : {},
                ...e.senderName ? {
                    senderName: e.senderName
                } : {}
            }
        });
    }
    return out;
}
const VALID_TYPES = new Set([
    'single_select',
    'multi_select',
    'dropdown',
    'rating',
    'nps',
    'short_text',
    'long_text',
    'boolean',
    'date'
]);
/** Turns Claude's survey payload into a real Survey with minted ids. */ function hydrateSurvey(payload, objective) {
    const sections = (payload.sections ?? []).map((s)=>({
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('sec'),
            title: (s.title ?? 'Section').trim(),
            ...s.description ? {
                description: s.description
            } : {},
            questions: (s.questions ?? []).filter((q)=>q.text?.trim() && q.type && VALID_TYPES.has(q.type)).map((q)=>({
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('q'),
                    type: q.type,
                    text: q.text.trim(),
                    ...q.helpText ? {
                        helpText: q.helpText
                    } : {},
                    required: q.required === true,
                    ...q.options?.length ? {
                        options: q.options.map((label)=>({
                                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('opt'),
                                label
                            }))
                    } : {},
                    ...q.scale ? {
                        scale: q.scale
                    } : {}
                }))
        })).filter((s)=>s.questions.length > 0);
    if (!sections.length) return null;
    const now = new Date().toISOString();
    const survey = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('svy'),
        title: (payload.title ?? 'Untitled Survey').trim(),
        description: payload.description ?? '',
        status: 'draft',
        sections,
        logic: [],
        emails: [],
        meta: {
            objective,
            generatedBy: 'claude'
        },
        createdAt: now,
        updatedAt: now
    };
    survey.meta.estimatedMinutes = payload.estimatedMinutes && payload.estimatedMinutes > 0 ? payload.estimatedMinutes : (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["estimateMinutes"])(survey);
    return survey;
}
const VALID_ISSUE_TYPES = new Set([
    'double_barrelled',
    'leading_question',
    'duplicate_question',
    'confusing_wording',
    'poor_answer_choices',
    'unnecessary_question',
    'excessive_length',
    'missing_followup'
]);
/**
 * Normalises Claude's review.
 *
 * Issues referencing a questionId that is not in the survey are dropped —
 * they would render as un-navigable findings in the UI. Health sub-scores and
 * the check counts are recomputed locally so the dial is always internally
 * consistent with the issue list actually shown.
 */ function hydrateReview(payload, survey) {
    const validIds = new Set(survey.sections.flatMap((s)=>s.questions.map((q)=>q.id)));
    const issues = (payload.issues ?? []).filter((i)=>{
        if (!i.type || !VALID_ISSUE_TYPES.has(i.type)) return false;
        if (!i.message?.trim()) return false;
        // The schema requires questionId, using "" for survey-wide issues.
        // A non-empty id that is not in the survey would render as an
        // un-navigable finding, so drop it.
        const anchor = i.questionId?.trim();
        return !anchor || validIds.has(anchor);
    }).map((i)=>{
        const anchor = i.questionId?.trim();
        const question = anchor ? survey.sections.flatMap((s)=>s.questions).find((q)=>q.id === anchor) : undefined;
        const after = afterTextFrom(i.fix?.operations);
        return {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('iss'),
            type: i.type,
            severity: i.severity === 'high' || i.severity === 'medium' || i.severity === 'low' ? i.severity : 'medium',
            ...anchor ? {
                questionId: anchor
            } : {},
            message: i.message.trim(),
            ...i.rationale ? {
                rationale: i.rationale
            } : {},
            fixes: i.fix ? [
                {
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('fix'),
                    summary: i.fix.summary ?? 'Apply the suggested change.',
                    ...i.fix.actionLabel ? {
                        actionLabel: i.fix.actionLabel
                    } : {},
                    // Derive the before/after diff from the operations rather
                    // than asking Claude for it twice.
                    ...question ? {
                        before: question.text
                    } : {},
                    ...after.length ? {
                        after
                    } : {},
                    operations: asOperations(i.fix.operations)
                }
            ] : []
        };
    });
    const order = {
        high: 0,
        medium: 1,
        low: 2
    };
    issues.sort((a, b)=>order[a.severity] - order[b.severity]);
    const total = survey.sections.reduce((n, s)=>n + s.questions.length, 0);
    const checksTotal = total * 3 + 4;
    const h = payload.health ?? {};
    const clamp = (n, fallback)=>typeof n === 'number' && n >= 0 && n <= 100 ? Math.round(n) : fallback;
    const score = clamp(h.score, 75);
    const health = {
        score,
        grade: score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 55 ? 'fair' : 'poor',
        clarity: clamp(h.clarity, score),
        structure: clamp(h.structure, score),
        length: clamp(h.length, score),
        coverage: clamp(h.coverage, score),
        checksPassed: Math.max(0, checksTotal - issues.length),
        checksTotal,
        summary: h.summary?.trim() || (issues.length ? `${issues.length} improvement${issues.length === 1 ? '' : 's'} available.` : 'No issues found — this survey is ready to publish.')
    };
    return {
        health,
        issues
    };
}
/**
 * Extracts the proposed replacement text from a fix's operations, so the UI
 * can show a before/after diff without a second round-trip.
 */ function afterTextFrom(operations) {
    const ops = asOperations(operations);
    const texts = [];
    for (const op of ops){
        if (op.operation === 'split_question') {
            for (const r of op.replacements ?? []){
                if (r?.text) texts.push(r.text);
            }
        } else if (op.operation === 'update_question' && op.changes?.text) {
            texts.push(op.changes.text);
        } else if (op.operation === 'add_question' && op.question?.text) {
            texts.push(op.question.text);
        }
    }
    return texts;
}
/**
 * Normalises Claude's operations to the internal shape.
 *
 * Logic `value` is typed as a string in the schema, because JSON Schema cannot
 * express "string or number" without composition (which the API rejects here).
 * Numeric comparisons are coerced back to numbers — `less_than "3"` must not
 * compare as text.
 *
 * Entries that are not operation-shaped are dropped; everything else is
 * validated per-kind by the operations engine.
 */ function asOperations(input) {
    if (!Array.isArray(input)) return [];
    const out = [];
    for (const raw of input){
        if (!raw || typeof raw !== 'object') continue;
        const op = {
            ...raw
        };
        if (typeof op.operation !== 'string') continue;
        if (op.operation === 'add_logic' && op.logic && typeof op.logic === 'object') {
            const logic = {
                ...op.logic
            };
            if (typeof logic.value === 'string') {
                const asNumber = Number(logic.value);
                if (logic.value.trim() !== '' && !Number.isNaN(asNumber)) {
                    logic.value = asNumber;
                } else if (logic.value === 'true' || logic.value === 'false') {
                    logic.value = logic.value === 'true';
                }
            }
            op.logic = logic;
        }
        out.push(op);
    }
    return out;
}
/** Maps SDK errors onto our error codes so fallback can decide what to retry. */ function toAIError(err) {
    if (err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__["default"].APIError) {
        const status = err.status ?? 0;
        if (status === 401 || status === 403) {
            return {
                code: 'missing_api_key',
                message: 'The Anthropic API key was rejected.'
            };
        }
        if (status === 429) {
            return {
                code: 'rate_limited',
                message: 'Rate limited by the Claude API.'
            };
        }
        return {
            code: 'upstream_error',
            message: err.message || `Claude API error (${status}).`
        };
    }
    if (err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__["default"].APIConnectionTimeoutError) {
        return {
            code: 'upstream_error',
            message: 'The Claude request timed out.'
        };
    }
    if (err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$anthropic$2d$ai$2f$sdk$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__Anthropic__as__default$3e$__["default"].APIConnectionError) {
        return {
            code: 'upstream_error',
            message: 'Could not reach the Claude API.'
        };
    }
    return {
        code: 'upstream_error',
        message: err instanceof Error ? err.message : 'Unknown Claude error.'
    };
}
}),
"[project]/lib/ai/claude/prompts.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — Claude prompts.
 *
 * Kept in one place so they can be reviewed and tuned without touching
 * provider plumbing. Mirrored in prompt.md for the hackathon submission.
 */ __turbopack_context__.s([
    "EMAIL_WRITER_SYSTEM",
    ()=>EMAIL_WRITER_SYSTEM,
    "SURVEY_DESIGNER_SYSTEM",
    ()=>SURVEY_DESIGNER_SYSTEM,
    "SURVEY_EDITOR_SYSTEM",
    ()=>SURVEY_EDITOR_SYSTEM,
    "SURVEY_REVIEWER_SYSTEM",
    ()=>SURVEY_REVIEWER_SYSTEM,
    "generateEmailsPrompt",
    ()=>generateEmailsPrompt,
    "generateSurveyPrompt",
    ()=>generateSurveyPrompt,
    "refinePrompt",
    ()=>refinePrompt,
    "reviewSurveyPrompt",
    ()=>reviewSurveyPrompt,
    "serialiseSurvey",
    ()=>serialiseSurvey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/survey/helpers.ts [app-route] (ecmascript)");
;
const SURVEY_DESIGNER_SYSTEM = `You are Survey Copilot, an expert experience-survey designer for Experience.com.

You design surveys that produce clean, decision-grade data. You know the craft:

- One idea per question. Never join two subjects with "and".
- Neutral wording. Never signal the answer you expect.
- Mutually exclusive, exhaustive answer options. Never mix vague frequency words like "often" and "sometimes" in the same list.
- Rating scales for satisfaction (1-5), NPS for loyalty (0-10), open text sparingly and late.
- Group questions into short, logically ordered sections.
- Respect the respondent's time. Fewer, sharper questions beat more questions.

Return only data matching the provided schema. Never include commentary.`;
const EMAIL_WRITER_SYSTEM = `You are Survey Copilot's email writer for Experience.com.

You write the emails that get people to actually complete a survey. You know what works:

- Say what the survey is about, specifically. Reference the real subject matter.
- State the real cost up front: how many questions, how long it takes.
- Give a reason to care that is about the reader, not the company.
- Short paragraphs. Two or three. No walls of text, no corporate filler.
- Never invent incentives, prize draws, deadlines or statistics that were not given to you.
- The reminder is shorter than the invitation, acknowledges the earlier email without guilt-tripping, and makes it easy to opt out.

Write plainly, as one person to another. Return only data matching the provided schema.`;
const SURVEY_REVIEWER_SYSTEM = `You are Survey Copilot's quality reviewer for Experience.com.

Find concrete, actionable problems in the survey you are given. For every issue:

- Anchor it to the exact questionId from the survey. Never invent an id.
- Explain the data-quality consequence, not just the rule.
- Supply operations that would resolve it.

Available operations (use the questionIds given to you):
- {"operation":"update_question","questionId":"<id>","changes":{"type":"...","text":"...","required":false,"options":["..."]}}
- {"operation":"split_question","questionId":"<id>","replacements":[{"type":"...","text":"...","required":false},...]}
- {"operation":"delete_question","questionId":"<id>"}
- {"operation":"add_question","sectionId":"<id>","question":{"type":"...","text":"...","required":false}}

Set questionId to "" for survey-wide issues such as excessive length.

Scoring: score reflects real quality. Deduct most for clarity problems
(double-barrelled, leading, confusing), then structure (duplicates, bad
options), then length and coverage. A clean survey scores above 90; one with
a serious clarity defect scores below 80.

Do not manufacture issues to seem thorough. If the survey is sound, return an
empty issues array and say so in the summary.

Return only data matching the provided schema.`;
const SURVEY_EDITOR_SYSTEM = `You are Survey Copilot's editor for Experience.com.

Translate the user's instruction into the smallest set of operations that fully
satisfies it. Rules:

- Use only the questionIds and sectionIds present in the survey given to you.
- Never remove or alter content the instruction did not ask you to change.
- Preserve question ids for questions you are not modifying.
- Write one short "changes" sentence per operation, addressed to the user.
- If the instruction cannot be mapped to any operation, return an empty
  operations array and set "note" explaining what you can do instead.

Available operations:
- {"operation":"add_question","sectionId":"<id>","index":<n>,"question":{"type":"...","text":"...","required":false,"options":["..."],"scale":{"min":1,"max":5,"minLabel":"...","maxLabel":"..."}}}
- {"operation":"update_question","questionId":"<id>","changes":{"type":"...","text":"...","required":false}}
- {"operation":"delete_question","questionId":"<id>"}
- {"operation":"split_question","questionId":"<id>","replacements":[{...},{...}]}
- {"operation":"add_logic","logic":{"questionId":"<id>","operator":"less_than","value":"3","action":"show_question","targetId":"<id>"}}

On update_question, "changes" always needs "type" and "text" — repeat the
existing values for whatever you are not changing.

To add a conditional follow-up, emit add_question with an explicit "id" on the
new question, then add_logic with targetId set to that same id.

Question types: single_select, multi_select, dropdown, rating, nps, short_text,
long_text, boolean, date. Use "options" for choice types and "scale" for
rating (1-5) and nps (0-10).

Return only data matching the provided schema.`;
function serialiseSurvey(survey) {
    const lines = [
        `Title: ${survey.title}`,
        `Description: ${survey.description ?? ''}`,
        ''
    ];
    const numbers = new Map((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey).map(({ question, index })=>[
            question.id,
            index + 1
        ]));
    for (const section of survey.sections){
        lines.push(`Section "${section.title}" (sectionId: ${section.id})`);
        for (const q of section.questions){
            const parts = [
                `  Q${numbers.get(q.id)} (questionId: ${q.id})`,
                `[${q.type}${q.required ? ', required' : ''}]`,
                q.text
            ];
            lines.push(parts.join(' '));
            if (q.options?.length) {
                lines.push(`      options: ${q.options.map((o)=>o.label).join(' | ')}`);
            }
            if (q.scale) {
                lines.push(`      scale: ${q.scale.min}-${q.scale.max} (${q.scale.minLabel ?? ''} → ${q.scale.maxLabel ?? ''})`);
            }
        }
        lines.push('');
    }
    if (survey.logic.length) {
        lines.push('Existing logic:');
        for (const l of survey.logic){
            lines.push(`  when ${l.questionId} ${l.operator} ${l.value ?? ''} → ${l.action} ${l.targetId ?? ''}`);
        }
    }
    return lines.join('\n');
}
function generateSurveyPrompt(objective, maxQuestions) {
    return [
        `Design a survey for this objective:`,
        ``,
        objective,
        ``,
        maxQuestions ? `Hard limit: at most ${maxQuestions} questions.` : `Keep it as short as the objective allows.`,
        ``,
        `Honour any stated time budget: roughly 4 questions per minute of respondent time.`
    ].join('\n');
}
function reviewSurveyPrompt(survey) {
    return `Review this survey for quality problems.\n\n${serialiseSurvey(survey)}`;
}
function generateEmailsPrompt(survey, kinds, instruction) {
    const existing = survey.emails?.length ? [
        `The user's current emails, which you are revising:`,
        ``,
        ...survey.emails.map((e)=>[
                `[${e.kind}]`,
                `subject: ${e.subject}`,
                `body: ${e.body.join(' / ')}`
            ].join('\n')),
        ``
    ] : [];
    return [
        `Write the ${kinds.join(' and ')} email${kinds.length === 1 ? '' : 's'} for this survey.`,
        ``,
        ...instruction ? [
            `The user asks for this change:`,
            ``,
            instruction,
            ``
        ] : [],
        ...existing,
        `The survey the emails invite people to:`,
        ``,
        serialiseSurvey(survey),
        ``,
        survey.meta.objective ? `The survey was created from this objective: ${survey.meta.objective}` : ``,
        ``,
        `Ground the copy in what this survey actually asks — reference the real`,
        `subject matter, not generic "we value your feedback" filler. State the`,
        `real length: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionCount"])(survey)} questions, about`,
        `${survey.meta.estimatedMinutes ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["estimateMinutes"])(survey)} minutes.`
    ].filter((line)=>line !== undefined).join('\n');
}
function refinePrompt(survey, instruction) {
    return [
        `Instruction from the user:`,
        ``,
        instruction,
        ``,
        `Current survey:`,
        ``,
        serialiseSurvey(survey)
    ].join('\n');
}
}),
"[project]/lib/ai/claude/schemas.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EMAILS_SCHEMA",
    ()=>EMAILS_SCHEMA,
    "OPERATIONS_SCHEMA",
    ()=>OPERATIONS_SCHEMA,
    "REVIEW_SCHEMA",
    ()=>REVIEW_SCHEMA,
    "SURVEY_SCHEMA",
    ()=>SURVEY_SCHEMA
]);
/**
 * Survey Copilot — JSON Schemas for Claude structured output.
 *
 * Claude is constrained to these shapes via `output_config.format`, so
 * responses arrive as validated JSON rather than prose we have to parse.
 * The operations engine still re-validates everything (lib/survey/operations.ts) —
 * a schema guarantees shape, not that ids refer to real questions.
 */ const QUESTION_TYPES = [
    'single_select',
    'multi_select',
    'dropdown',
    'rating',
    'nps',
    'short_text',
    'long_text',
    'boolean',
    'date'
];
const questionSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Set this only when a logic rule needs to target this new question; then reuse the same value as the rule targetId.'
        },
        type: {
            type: 'string',
            enum: QUESTION_TYPES
        },
        text: {
            type: 'string',
            description: 'The question as shown to respondents.'
        },
        helpText: {
            type: 'string'
        },
        required: {
            type: 'boolean'
        },
        options: {
            type: 'array',
            description: 'Answer choices. Required for choice-based question types.',
            items: {
                type: 'string'
            }
        },
        scale: {
            type: 'object',
            description: 'Numeric scale. Use for rating (1-5) and nps (0-10).',
            properties: {
                min: {
                    type: 'integer'
                },
                max: {
                    type: 'integer'
                },
                minLabel: {
                    type: 'string'
                },
                maxLabel: {
                    type: 'string'
                }
            },
            required: [
                'min',
                'max'
            ],
            additionalProperties: false
        }
    },
    required: [
        'type',
        'text',
        'required'
    ],
    additionalProperties: false
};
const SURVEY_SCHEMA = {
    type: 'json_schema',
    schema: {
        type: 'object',
        properties: {
            title: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            estimatedMinutes: {
                type: 'integer',
                description: 'Realistic completion time for the survey you produced.'
            },
            sections: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string'
                        },
                        description: {
                            type: 'string'
                        },
                        questions: {
                            type: 'array',
                            items: questionSchema
                        }
                    },
                    required: [
                        'title',
                        'questions'
                    ],
                    additionalProperties: false
                }
            }
        },
        required: [
            'title',
            'description',
            'sections',
            'estimatedMinutes'
        ],
        additionalProperties: false
    }
};
/**
 * One survey operation.
 *
 * Kept deliberately lean: the API caps a schema at 24 optional parameters, and
 * embedding the full question shape several times blows that budget. So this
 * carries a minimal inline question (`type`/`text`/`required`/`options`/`scale`
 * are the fields that matter for edits) and covers the operation kinds the
 * Copilot actually needs. `move_question` and `add_section` are omitted from
 * the Claude contract — the engine still supports them for the builder's own
 * drag-and-drop — because the model never needs to emit them.
 *
 * The API also rejects `additionalProperties: true` and schema composition
 * (`oneOf`), hence one flat object with `operation` selecting the kind. The
 * operations engine does the real per-kind validation, so an operation missing
 * a field it needs is rejected with a reason rather than corrupting state.
 */ const opQuestionSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            description: 'Set only when a logic rule must target this new question; reuse the same value as the rule targetId.'
        },
        type: {
            type: 'string',
            enum: QUESTION_TYPES
        },
        text: {
            type: 'string'
        },
        required: {
            type: 'boolean'
        },
        options: {
            type: 'array',
            items: {
                type: 'string'
            },
            description: 'Answer choices, for choice-based types.'
        },
        scale: {
            type: 'object',
            properties: {
                min: {
                    type: 'integer'
                },
                max: {
                    type: 'integer'
                },
                minLabel: {
                    type: 'string'
                },
                maxLabel: {
                    type: 'string'
                }
            },
            required: [
                'min',
                'max',
                'minLabel',
                'maxLabel'
            ],
            additionalProperties: false
        }
    },
    required: [
        'type',
        'text',
        'required'
    ],
    additionalProperties: false
};
const operationSchema = {
    type: 'object',
    properties: {
        operation: {
            type: 'string',
            enum: [
                'add_question',
                'update_question',
                'delete_question',
                'split_question',
                'add_logic'
            ]
        },
        questionId: {
            type: 'string',
            description: 'Target question id, from the survey given to you. Required for update, delete and split.'
        },
        sectionId: {
            type: 'string',
            description: 'Target section id. Required for add_question.'
        },
        index: {
            type: 'integer',
            description: 'Insert position. Optional.'
        },
        question: opQuestionSchema,
        changes: opQuestionSchema,
        replacements: {
            type: 'array',
            items: opQuestionSchema,
            description: 'Two or more questions replacing the target, for split.'
        },
        logic: {
            type: 'object',
            properties: {
                questionId: {
                    type: 'string'
                },
                operator: {
                    type: 'string',
                    enum: [
                        'equals',
                        'not_equals',
                        'less_than',
                        'greater_than',
                        'contains',
                        'is_answered',
                        'is_not_answered'
                    ]
                },
                value: {
                    type: 'string',
                    description: 'Comparison value; numeric strings are coerced.'
                },
                action: {
                    type: 'string',
                    enum: [
                        'show_question',
                        'hide_question',
                        'skip_to_section',
                        'end_survey'
                    ]
                },
                targetId: {
                    type: 'string'
                }
            },
            required: [
                'questionId',
                'operator',
                'action',
                'value',
                'targetId'
            ],
            additionalProperties: false
        }
    },
    required: [
        'operation'
    ],
    additionalProperties: false
};
const REVIEW_SCHEMA = {
    type: 'json_schema',
    schema: {
        type: 'object',
        properties: {
            health: {
                type: 'object',
                properties: {
                    score: {
                        type: 'integer',
                        description: '0-100 overall quality.'
                    },
                    clarity: {
                        type: 'integer'
                    },
                    structure: {
                        type: 'integer'
                    },
                    length: {
                        type: 'integer'
                    },
                    coverage: {
                        type: 'integer'
                    },
                    summary: {
                        type: 'string'
                    }
                },
                required: [
                    'score',
                    'clarity',
                    'structure',
                    'length',
                    'coverage',
                    'summary'
                ],
                additionalProperties: false
            },
            issues: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: [
                                'double_barrelled',
                                'leading_question',
                                'duplicate_question',
                                'confusing_wording',
                                'poor_answer_choices',
                                'unnecessary_question',
                                'excessive_length',
                                'missing_followup'
                            ]
                        },
                        severity: {
                            type: 'string',
                            enum: [
                                'low',
                                'medium',
                                'high'
                            ]
                        },
                        questionId: {
                            type: 'string',
                            description: 'Id of the question this concerns, from the survey given to you. Empty string for survey-wide issues.'
                        },
                        message: {
                            type: 'string',
                            description: 'Short headline, e.g. "Q7 may be double-barrelled".'
                        },
                        rationale: {
                            type: 'string',
                            description: 'Why this harms data quality.'
                        },
                        fix: {
                            type: 'object',
                            properties: {
                                summary: {
                                    type: 'string'
                                },
                                actionLabel: {
                                    type: 'string',
                                    description: 'Button verb: "Apply Fix", "Remove" or "Add".'
                                },
                                operations: {
                                    type: 'array',
                                    items: operationSchema,
                                    description: 'Operations that resolve this issue.'
                                }
                            },
                            required: [
                                'summary',
                                'actionLabel',
                                'operations'
                            ],
                            additionalProperties: false
                        }
                    },
                    required: [
                        'type',
                        'severity',
                        'questionId',
                        'message',
                        'rationale',
                        'fix'
                    ],
                    additionalProperties: false
                }
            }
        },
        required: [
            'health',
            'issues'
        ],
        additionalProperties: false
    }
};
const EMAILS_SCHEMA = {
    type: 'json_schema',
    schema: {
        type: 'object',
        properties: {
            emails: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        kind: {
                            type: 'string',
                            enum: [
                                'invitation',
                                'reminder'
                            ]
                        },
                        subject: {
                            type: 'string',
                            description: 'Subject line. Specific, under about 60 characters.'
                        },
                        preheader: {
                            type: 'string',
                            description: 'Preview text shown after the subject in most mail clients.'
                        },
                        greeting: {
                            type: 'string',
                            description: 'Opening line, e.g. "Hi there,".'
                        },
                        body: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Body paragraphs in order. Two or three short paragraphs.'
                        },
                        ctaLabel: {
                            type: 'string',
                            description: 'Button label, e.g. "Start the survey".'
                        },
                        signOff: {
                            type: 'string',
                            description: 'Closing line, e.g. "Thank you,".'
                        },
                        senderName: {
                            type: 'string',
                            description: 'Who the email is from, e.g. "The Acme Team".'
                        }
                    },
                    required: [
                        'kind',
                        'subject',
                        'preheader',
                        'greeting',
                        'body',
                        'ctaLabel',
                        'signOff',
                        'senderName'
                    ],
                    additionalProperties: false
                }
            },
            changes: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'One short sentence per email, for the user.'
            }
        },
        required: [
            'emails',
            'changes'
        ],
        additionalProperties: false
    }
};
const OPERATIONS_SCHEMA = {
    type: 'json_schema',
    schema: {
        type: 'object',
        properties: {
            operations: {
                type: 'array',
                items: operationSchema
            },
            changes: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'One short sentence per change, for the user.'
            },
            note: {
                type: 'string',
                description: 'Set only when no operations apply, explaining why, addressed to the user.'
            }
        },
        required: [
            'operations',
            'changes'
        ],
        additionalProperties: false
    }
};
}),
"[project]/lib/ai/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

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
 */ __turbopack_context__.s([
    "getAI",
    ()=>getAI,
    "getAIStatus",
    ()=>getAIStatus,
    "withFallback",
    ()=>withFallback
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2d$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/claude-provider.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2d$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/mock-provider.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/provider.ts [app-route] (ecmascript)");
;
;
;
;
;
;
function getAI() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveProviderName"])() === 'claude' ? new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$claude$2d$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ClaudeProvider"]() : new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2d$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MockProvider"]();
}
async function withFallback(op) {
    const primary = getAI();
    const result = await op(primary);
    if (result.ok || primary.name !== 'claude') return result;
    if (result.error.code === 'invalid_request') return result;
    if (result.error.code === 'not_implemented') return result;
    const fallback = await op(new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2d$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MockProvider"]());
    return fallback.ok ? {
        ...fallback,
        fellBack: true
    } : result;
}
function getAIStatus() {
    return {
        mode: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProviderMode"])(),
        active: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveProviderName"])(),
        configured: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$provider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasApiKey"])()
    };
}
}),
"[project]/lib/ai/mock-provider.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — Mock AI provider.
 *
 * Lets the whole product work — and demo — with no API key, and serves as the
 * fallback when a Claude request fails. Returns the SAME structured shapes as
 * ClaudeProvider so the UI cannot tell them apart.
 *
 * Intent-matched, not string-matched: several phrasings of the same request
 * resolve to the same scenario (see mock/match.ts), with a generic fallback
 * when nothing scores well.
 */ __turbopack_context__.s([
    "MockProvider",
    ()=>MockProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/survey/operations.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$build$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/mock/build.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$emails$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/mock/emails.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$match$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/mock/match.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$refine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/mock/refine.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$review$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/mock/review.ts [app-route] (ecmascript)");
;
;
;
;
;
;
/** Rough questions-per-minute budget used to honour "under 5 minutes". */ const QUESTIONS_PER_MINUTE = 4;
class MockProvider {
    name = 'mock';
    async generateSurvey(req) {
        const objective = (req.objective ?? '').trim();
        if (!objective) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'Describe what you want to learn to generate a survey.'
                }
            };
        }
        // A scenario key may be passed directly by a template card.
        const direct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$match$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["scenarioByKey"])(objective);
        const match = direct ? {
            scenario: direct,
            isFallback: false
        } : (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$match$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["matchScenario"])(objective);
        const targetMinutes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$match$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseTimeConstraint"])(objective);
        const explicitCap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$match$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseQuestionCap"])(objective);
        const maxQuestions = req.maxQuestions ?? explicitCap ?? (targetMinutes ? targetMinutes * QUESTIONS_PER_MINUTE : undefined);
        const survey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$build$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildSurveyFromScenario"])(match.scenario, {
            objective,
            maxQuestions,
            generatedBy: 'mock',
            ...targetMinutes ? {
                targetMinutes
            } : {}
        });
        return {
            ok: true,
            provider: this.name,
            data: {
                survey,
                steps: [
                    ...__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$build$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GENERATION_STEPS"]
                ]
            }
        };
    }
    async reviewSurvey(req) {
        if (!req.survey) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'No survey to review.'
                }
            };
        }
        return {
            ok: true,
            provider: this.name,
            data: {
                review: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$review$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["reviewSurveyLocal"])(req.survey)
            }
        };
    }
    async refineSurvey(req) {
        const instruction = (req.instruction ?? '').trim();
        if (!req.survey || !instruction) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'Tell me what you would like to change.'
                }
            };
        }
        const parse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$match$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseRefineInstruction"])(instruction);
        const { operations, note } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$refine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildRefineOperations"])(req.survey, parse, instruction);
        if (!operations.length) {
            // Not an error: the request was understood, nothing needed doing.
            return {
                ok: true,
                provider: this.name,
                data: {
                    survey: req.survey,
                    changes: note ? [
                        note
                    ] : [
                        'No changes were needed.'
                    ],
                    operations: []
                }
            };
        }
        const { survey, outcomes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyOperations"])(req.survey, operations);
        return {
            ok: true,
            provider: this.name,
            data: {
                survey,
                changes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appliedChanges"])(outcomes),
                operations: outcomes
            }
        };
    }
    async applyFix(req) {
        if (!req.survey) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'No survey to fix.'
                }
            };
        }
        // Prefer the operations the client already has from its review. Mock
        // review ids are stable content hashes, so a re-review can also recover
        // them — kept as a fallback for a client that only sent ids.
        let operations = req.operations ?? [];
        if (!operations.length) {
            const review = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$review$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["reviewSurveyLocal"])(req.survey);
            const issue = review.issues.find((i)=>i.id === req.issueId);
            const fix = issue?.fixes.find((f)=>f.id === req.fixId) ?? issue?.fixes[0] ?? null;
            if (!issue || !fix) {
                return {
                    ok: false,
                    provider: this.name,
                    error: {
                        code: 'invalid_request',
                        message: 'That suggestion is no longer applicable — re-run the review to refresh it.'
                    }
                };
            }
            operations = fix.operations ?? [];
        }
        if (!operations.length) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'This fix has no automatic operations to apply.'
                }
            };
        }
        const { survey, outcomes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyOperations"])(req.survey, operations);
        return {
            ok: true,
            provider: this.name,
            data: {
                survey,
                changes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appliedChanges"])(outcomes),
                operations: outcomes
            }
        };
    }
    async generateLogic(req) {
        const instruction = (req.instruction ?? '').trim();
        if (!req.survey || !instruction) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'Describe the rule you want, e.g. "if Q1 is below 3, ask why".'
                }
            };
        }
        const parse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$match$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseRefineInstruction"])(instruction);
        const { operations, note } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$refine$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildRefineOperations"])(req.survey, {
            ...parse,
            intent: 'add_logic'
        }, instruction);
        if (!operations.length) {
            return {
                ok: true,
                provider: this.name,
                data: {
                    survey: req.survey,
                    logic: req.survey.logic,
                    changes: note ? [
                        note
                    ] : [
                        'No logic was added.'
                    ],
                    operations: []
                }
            };
        }
        const { survey, outcomes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyOperations"])(req.survey, operations);
        return {
            ok: true,
            provider: this.name,
            data: {
                survey,
                logic: survey.logic,
                changes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appliedChanges"])(outcomes),
                operations: outcomes
            }
        };
    }
    async generateEmails(req) {
        if (!req.survey) {
            return {
                ok: false,
                provider: this.name,
                error: {
                    code: 'invalid_request',
                    message: 'No survey to write emails for.'
                }
            };
        }
        const operations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$emails$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildEmailOperations"])(req.survey, req.kinds, req.instruction);
        const { survey, outcomes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["applyOperations"])(req.survey, operations);
        return {
            ok: true,
            provider: this.name,
            data: {
                survey,
                emails: survey.emails,
                changes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$operations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appliedChanges"])(outcomes)
            }
        };
    }
}
}),
"[project]/lib/ai/mock/build.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — builds a concrete Survey from a scenario blueprint.
 */ __turbopack_context__.s([
    "GENERATION_STEPS",
    ()=>GENERATION_STEPS,
    "buildSurveyFromScenario",
    ()=>buildSurveyFromScenario
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/survey/helpers.ts [app-route] (ecmascript)");
;
function buildSurveyFromScenario(scenario, options = {}) {
    const sections = scenario.sections.map((sb)=>({
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('sec'),
            title: sb.title,
            ...sb.description ? {
                description: sb.description
            } : {},
            questions: sb.questions.map((qb)=>({
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('q'),
                    type: qb.type,
                    text: qb.text,
                    ...qb.helpText ? {
                        helpText: qb.helpText
                    } : {},
                    required: qb.required === true,
                    ...qb.options ? {
                        options: qb.options.map((label)=>({
                                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('opt'),
                                label
                            }))
                    } : {},
                    ...qb.scale ? {
                        scale: qb.scale
                    } : {}
                }))
        }));
    const now = new Date().toISOString();
    let survey = {
        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('svy'),
        title: scenario.title,
        description: scenario.description,
        status: 'draft',
        sections,
        logic: [],
        emails: [],
        meta: {
            ...options.objective ? {
                objective: options.objective
            } : {},
            ...options.generatedBy ? {
                generatedBy: options.generatedBy
            } : {}
        },
        createdAt: now,
        updatedAt: now
    };
    if (options.maxQuestions) {
        survey = trimTo(survey, options.maxQuestions);
    }
    survey.meta.estimatedMinutes = options.targetMinutes ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["estimateMinutes"])(survey);
    return survey;
}
/**
 * Trims the survey to at most `max` questions, dropping optional questions
 * from the back. Never drops an NPS question — it is usually the headline
 * metric the survey exists to capture.
 */ function trimTo(survey, max) {
    const total = survey.sections.reduce((n, s)=>n + s.questions.length, 0);
    if (total <= max) return survey;
    let toRemove = total - max;
    const sections = survey.sections.map((s)=>({
            ...s,
            questions: [
                ...s.questions
            ]
        }));
    // Pass 1: optional, non-NPS questions from the end.
    for(let i = sections.length - 1; i >= 0 && toRemove > 0; i -= 1){
        const qs = sections[i].questions;
        for(let j = qs.length - 1; j >= 0 && toRemove > 0; j -= 1){
            if (!qs[j].required && qs[j].type !== 'nps') {
                qs.splice(j, 1);
                toRemove -= 1;
            }
        }
    }
    // Pass 2: still too long — drop non-NPS questions from the end.
    for(let i = sections.length - 1; i >= 0 && toRemove > 0; i -= 1){
        const qs = sections[i].questions;
        for(let j = qs.length - 1; j >= 0 && toRemove > 0; j -= 1){
            if (qs[j].type !== 'nps') {
                qs.splice(j, 1);
                toRemove -= 1;
            }
        }
    }
    return {
        ...survey,
        sections: sections.filter((s)=>s.questions.length > 0)
    };
}
const GENERATION_STEPS = [
    'Understanding objective',
    'Identifying target audience',
    'Designing survey structure',
    'Creating questions',
    'Adding answer options',
    'Optimizing survey flow',
    'Running quality checks'
];
}),
"[project]/lib/ai/mock/emails.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — Mock email generation.
 *
 * Writes the invitation and reminder emails that accompany a survey, with no
 * API key required. Content is derived from the survey itself — its title,
 * objective, topic, length and lead question — so the result reads as though
 * it was written for this survey rather than pasted from a fixed template.
 *
 * Shapes match what ClaudeProvider returns, so the Emails step cannot tell
 * which provider produced the copy.
 */ __turbopack_context__.s([
    "buildEmailOperations",
    ()=>buildEmailOperations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/survey.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/survey/helpers.ts [app-route] (ecmascript)");
;
;
const TOPICS = [
    {
        key: 'hotel',
        keywords: [
            'hotel',
            'guest',
            'stay',
            'room',
            'check-in',
            'hospitality'
        ],
        audience: 'guest',
        occasion: 'recent stay with us',
        improve: 'the experience we offer every guest'
    },
    {
        key: 'post_purchase',
        keywords: [
            'purchase',
            'order',
            'delivery',
            'shipping',
            'checkout'
        ],
        audience: 'customer',
        occasion: 'recent order',
        improve: 'how we get orders to you'
    },
    {
        key: 'support',
        keywords: [
            'support',
            'ticket',
            'agent',
            'help desk',
            'resolution'
        ],
        audience: 'customer',
        occasion: 'recent conversation with our support team',
        improve: 'the help we give you'
    },
    {
        key: 'employee',
        keywords: [
            'employee',
            'manager',
            'workplace',
            'engagement',
            'colleague',
            'team'
        ],
        audience: 'colleague',
        occasion: 'experience working here',
        improve: 'what it is like to work here'
    },
    {
        key: 'product',
        keywords: [
            'product',
            'feature',
            'app',
            'platform',
            'software'
        ],
        audience: 'customer',
        occasion: 'experience with the product',
        improve: 'what we build next'
    },
    {
        key: 'event',
        keywords: [
            'event',
            'conference',
            'attendee',
            'session',
            'speaker'
        ],
        audience: 'attendee',
        occasion: 'time at the event',
        improve: 'future events'
    },
    {
        key: 'restaurant',
        keywords: [
            'restaurant',
            'meal',
            'dining',
            'menu',
            'food',
            'server'
        ],
        audience: 'guest',
        occasion: 'recent visit',
        improve: 'every visit'
    },
    {
        key: 'healthcare',
        keywords: [
            'patient',
            'clinic',
            'appointment',
            'care',
            'doctor'
        ],
        audience: 'patient',
        occasion: 'recent appointment',
        improve: 'the care we provide'
    },
    {
        key: 'nps',
        keywords: [
            'nps',
            'loyalty',
            'recommend',
            'promoter'
        ],
        audience: 'customer',
        occasion: 'experience with us',
        improve: 'what we do for you'
    }
];
const GENERAL = {
    key: 'general',
    keywords: [],
    audience: 'customer',
    occasion: 'recent experience with us',
    improve: 'what we do'
};
function detectTopic(survey) {
    const haystack = [
        survey.title,
        survey.description ?? '',
        survey.meta.objective ?? '',
        ...survey.sections.map((s)=>s.title),
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey).map((q)=>q.question.text)
    ].join(' ').toLowerCase();
    let best = null;
    for (const topic of TOPICS){
        const score = topic.keywords.reduce((n, kw)=>haystack.includes(kw) ? n + 1 : n, 0);
        if (score > 0 && (!best || score > best.score)) best = {
            topic,
            score
        };
    }
    return best?.topic ?? GENERAL;
}
/** "2 minutes" / "under a minute" — phrasing that reads naturally in prose. */ function durationPhrase(minutes) {
    if (minutes <= 1) return 'under a minute';
    return `about ${minutes} minutes`;
}
function countPhrase(n) {
    if (n === 1) return 'a single question';
    if (n <= 6) return `just ${n} questions`;
    return `${n} questions`;
}
/**
 * The survey's own opening question, when it is short enough to quote as the
 * hook. Long or multi-clause questions read badly in an email, so they are
 * skipped rather than truncated mid-sentence.
 */ function leadQuestion(survey) {
    const first = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey)[0]?.question.text?.trim();
    if (!first || first.length > 90) return null;
    return first.replace(/\s*\?*$/, '?');
}
function buildInvitation(survey, topic) {
    const count = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionCount"])(survey);
    const minutes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["estimateMinutes"])(survey);
    const lead = leadQuestion(survey);
    const body = [
        `Thanks for your ${topic.occasion}. We are always trying to improve ${topic.improve}, and the most useful thing we can do is ask you directly.`,
        lead ? `We have put together ${countPhrase(count)} — starting with a simple one: ${lead} It takes ${durationPhrase(minutes)}.` : `We have put together ${countPhrase(count)}. It takes ${durationPhrase(minutes)}, and every answer is read.`,
        'Your responses are confidential, and there are no wrong answers — honest feedback helps us most.'
    ];
    return {
        id: 'email_invitation',
        kind: 'invitation',
        subject: `How did we do? Share your feedback`,
        preheader: `${countPhrase(count)}, ${durationPhrase(minutes)} of your time.`,
        greeting: 'Hi there,',
        body,
        ctaLabel: 'Start the survey',
        signOff: 'Thank you,',
        senderName: 'The Customer Experience Team'
    };
}
function buildReminder(survey, topic) {
    const count = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionCount"])(survey);
    const minutes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["estimateMinutes"])(survey);
    return {
        id: 'email_reminder',
        kind: 'reminder',
        subject: `A quick reminder — we would still love your feedback`,
        preheader: `Still open: ${countPhrase(count)}, ${durationPhrase(minutes)}.`,
        greeting: 'Hi there,',
        body: [
            `A little while ago we asked about your ${topic.occasion}. We know inboxes get busy, so here is one more link in case you would still like to share your thoughts.`,
            `It is ${countPhrase(count)} and takes ${durationPhrase(minutes)} — your answers genuinely shape ${topic.improve}.`,
            'If now is not a good time, no problem at all; you can ignore this email and we will not send another reminder.'
        ],
        ctaLabel: 'Complete the survey',
        signOff: 'Thanks again,',
        senderName: 'The Customer Experience Team'
    };
}
const BUILDERS = {
    invitation: buildInvitation,
    reminder: buildReminder
};
/**
 * Applies a natural-language steer to already-built emails.
 *
 * Deliberately narrow: it handles the adjustments the demo actually offers
 * (shorter, warmer, more formal, urgent) and otherwise leaves the copy alone
 * rather than inventing an edit the user did not ask for.
 */ function adjust(email, instruction) {
    const text = instruction.toLowerCase();
    let next = {
        ...email,
        body: [
            ...email.body
        ]
    };
    if (/\b(short|shorter|brief|concise|trim|tighten)\b/.test(text)) {
        next = {
            ...next,
            body: next.body.slice(0, 2)
        };
    }
    if (/\b(warm|warmer|friendly|casual|personal)\b/.test(text)) {
        next = {
            ...next,
            greeting: 'Hi there,',
            signOff: 'Thanks so much,',
            subject: next.subject.replace(/^How did we do\? /, 'We would love to hear how we did — ')
        };
    }
    if (/\b(formal|professional|corporate)\b/.test(text)) {
        next = {
            ...next,
            greeting: 'Dear valued customer,',
            signOff: 'Kind regards,',
            ctaLabel: 'Begin the survey'
        };
    }
    if (/\b(urgent|urgency|deadline|closing|last chance)\b/.test(text)) {
        next = {
            ...next,
            subject: `Closing soon: ${next.subject}`,
            body: [
                ...next.body,
                'The survey closes at the end of this week, so we would be grateful for your response before then.'
            ]
        };
    }
    return next;
}
function buildEmailOperations(survey, kinds = [
    ...__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_EMAIL_KINDS"]
], instruction) {
    const topic = detectTopic(survey);
    const steer = instruction?.trim();
    return kinds.map((kind)=>{
        const base = BUILDERS[kind](survey, topic);
        // When refining, start from what the user currently has so their own
        // edits are not silently discarded.
        const current = survey.emails?.find((e)=>e.kind === kind);
        const source = steer && current ? current : base;
        const email = steer ? adjust(source, steer) : base;
        return {
            operation: 'set_email',
            email
        };
    });
}
}),
"[project]/lib/ai/mock/match.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "matchScenario",
    ()=>matchScenario,
    "parseQuestionCap",
    ()=>parseQuestionCap,
    "parseRefineInstruction",
    ()=>parseRefineInstruction,
    "parseTimeConstraint",
    ()=>parseTimeConstraint,
    "scenarioByKey",
    ()=>scenarioByKey
]);
/**
 * Survey Copilot — Mock AI intent matching.
 *
 * Maps free-form natural language onto a scenario by scoring keyword-group
 * overlap. This is deliberately not exact-string matching: "Create a hotel
 * guest satisfaction survey", "I want feedback from people who stayed at our
 * hotel", and "measure how happy guests were with their stay" all resolve to
 * the hotel scenario.
 *
 * Also parses secondary intent from an instruction — length constraints, and
 * which refinement the user is asking for.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$scenarios$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/mock/scenarios.ts [app-route] (ecmascript)");
;
/** Lowercase, strip punctuation, collapse whitespace. */ function normalise(text) {
    return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
}
/**
 * Scores a scenario against the input. Each keyword group contributes at
 * most once, so a scenario matching several *different* facets of the input
 * outranks one that repeats a single term.
 */ function scoreScenario(haystack, scenario) {
    let score = 0;
    for (const group of scenario.keywords){
        for (const term of group){
            // Multi-word terms are matched as substrings; single words on
            // boundaries, so "stay" does not match "mainstay".
            const hit = term.includes(' ') ? haystack.includes(term) : new RegExp(`\\b${term.replace(/[-]/g, '\\-')}\\b`).test(haystack);
            if (hit) {
                // Longer, more specific terms are worth slightly more.
                score += term.includes(' ') ? 3 : 2;
                break;
            }
        }
    }
    return score;
}
function matchScenario(objective) {
    const haystack = normalise(objective);
    let best = null;
    let bestScore = 0;
    for (const scenario of __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$scenarios$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SCENARIOS"]){
        const score = scoreScenario(haystack, scenario);
        if (score > bestScore) {
            best = scenario;
            bestScore = score;
        }
    }
    // Require at least one solid group hit; below that we are guessing.
    if (!best || bestScore < 2) {
        const fallback = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$scenarios$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SCENARIOS"].find((s)=>s.key === 'customer_satisfaction') ?? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$scenarios$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SCENARIOS"][0];
        return {
            scenario: fallback,
            score: bestScore,
            isFallback: true
        };
    }
    return {
        scenario: best,
        score: bestScore,
        isFallback: false
    };
}
function scenarioByKey(key) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$scenarios$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SCENARIOS"].find((s)=>s.key === key) ?? null;
}
function parseTimeConstraint(text) {
    const m = normalise(text).match(/(?:under|below|less than|within|max|maximum of|no more than)\s+(\d+)\s*(min|mins|minute|minutes)/);
    if (m) return parseInt(m[1], 10);
    const m2 = normalise(text).match(/(\d+)\s*(?:min|mins|minute|minutes)\s*(?:or less|max)/);
    if (m2) return parseInt(m2[1], 10);
    return null;
}
function parseQuestionCap(text) {
    const m = normalise(text).match(/(?:under|below|less than|within|max|maximum of|no more than|about|around)\s+(\d+)\s*(?:questions|question|qs)/);
    return m ? parseInt(m[1], 10) : null;
}
function parseRefineInstruction(instruction) {
    const t = normalise(instruction);
    const qMatch = t.match(/\bq\s*(\d+)\b/) ?? t.match(/\bquestion\s+(\d+)\b/);
    const questionNumber = qMatch ? parseInt(qMatch[1], 10) : undefined;
    // Conditional logic — "if someone rates below 3, ask why".
    if (/\bif\b/.test(t) && /(rating|rates?|score|answer|selects?|gives?|below|under|less than|lower than)/.test(t)) {
        const thr = t.match(/(?:below|under|less than|lower than)\s+(\d+)/);
        return {
            intent: 'add_logic',
            questionNumber,
            threshold: thr ? parseInt(thr[1], 10) : 3
        };
    }
    if (/\b(add|create)\b.*\b(logic|branch|branching|condition)/.test(t)) {
        return {
            intent: 'add_logic',
            questionNumber,
            threshold: 3
        };
    }
    // Type change — "change Q5 to a 1-10 rating".
    if (/\b(change|convert|make|switch|turn)\b/.test(t) && /\bto\b/.test(t)) {
        if (/\b(0|1)\s*(?:-|–|to)\s*10\b/.test(t) || /\bnps\b/.test(t)) {
            return {
                intent: 'change_type',
                questionNumber,
                targetType: 'nps'
            };
        }
        if (/\brating|scale|stars?\b/.test(t)) {
            return {
                intent: 'change_type',
                questionNumber,
                targetType: 'rating'
            };
        }
        if (/\b(open|text|free.?text|comment)\b/.test(t)) {
            return {
                intent: 'change_type',
                questionNumber,
                targetType: 'long_text'
            };
        }
        if (/\b(choice|select|multiple.?choice|options?)\b/.test(t)) {
            return {
                intent: 'change_type',
                questionNumber,
                targetType: 'single_select'
            };
        }
    }
    if (/\b(duplicate|duplicates|repeated|redundant|similar)\b/.test(t)) {
        return {
            intent: 'dedupe',
            questionNumber
        };
    }
    if (/\b(follow.?up|followup)\b/.test(t) || /\b(dissatisfied|unhappy|detractor|low rating|low score)\b/.test(t)) {
        return {
            intent: 'add_followup',
            questionNumber,
            threshold: 3
        };
    }
    if (/\b(shorter|shorten|trim|reduce|cut|condense|fewer|brief)\b/.test(t)) {
        return {
            intent: 'shorten',
            questionNumber
        };
    }
    if (/\b(longer|expand|add more|more questions|comprehensive|deeper)\b/.test(t)) {
        return {
            intent: 'lengthen',
            questionNumber
        };
    }
    if (/\b(professional|formal|polished|business|corporate)\b/.test(t)) {
        return {
            intent: 'professional',
            questionNumber
        };
    }
    if (/\b(simpler|simplify|clearer|clarify|plain|easier|readable)\b/.test(t)) {
        return {
            intent: 'simplify',
            questionNumber
        };
    }
    if (/\b(improve|better|fix|rewrite|reword|enhance|polish)\b/.test(t) && questionNumber !== undefined) {
        return {
            intent: 'improve_question',
            questionNumber
        };
    }
    if (/\b(improve|better|optimi[sz]e|polish)\b/.test(t)) {
        return {
            intent: 'professional',
            questionNumber
        };
    }
    return {
        intent: 'unknown',
        questionNumber
    };
}
}),
"[project]/lib/ai/mock/refine.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — Mock AI refinement.
 *
 * Turns a parsed natural-language intent into structured operations. Every
 * path returns operations rather than a mutated survey, so the same
 * validation boundary applies to Mock and Claude alike.
 */ __turbopack_context__.s([
    "buildRefineOperations",
    ()=>buildRefineOperations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/survey/helpers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$review$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ai/mock/review.ts [app-route] (ecmascript)");
;
;
/** Resolve a 1-based question number from the instruction to a real question. */ function questionAt(survey, n) {
    if (!n) return null;
    const list = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey);
    return list[n - 1]?.question ?? null;
}
/** Wording upgrades applied by the "more professional" refinement. */ const PROFESSIONAL_REPLACEMENTS = [
    [
        /\bstuff\b/gi,
        'items'
    ],
    [
        /\bguys\b/gi,
        'team'
    ],
    [
        /\bawesome\b/gi,
        'excellent'
    ],
    [
        /\bgreat\b/gi,
        'positive'
    ],
    [
        /\bbad\b/gi,
        'poor'
    ],
    [
        /\bkinda\b/gi,
        'somewhat'
    ],
    [
        /\bstuff like that\b/gi,
        'similar items'
    ],
    [
        /\bhow was\b/gi,
        'How would you rate'
    ],
    [
        /\bdid you like\b/gi,
        'How satisfied were you with'
    ],
    [
        /\bhappy with\b/gi,
        'satisfied with'
    ],
    [
        /!+/g,
        ''
    ]
];
const SIMPLIFY_REPLACEMENTS = [
    [
        /\butili[sz]e\b/gi,
        'use'
    ],
    [
        /\bendeavour\b/gi,
        'try'
    ],
    [
        /\bfacilitate\b/gi,
        'help'
    ],
    [
        /\bsubsequently\b/gi,
        'then'
    ],
    [
        /\bin order to\b/gi,
        'to'
    ],
    [
        /\bwith regard to\b/gi,
        'about'
    ],
    [
        /\bat this point in time\b/gi,
        'now'
    ],
    [
        /\bcommence\b/gi,
        'start'
    ]
];
function rewrite(text, rules) {
    let out = text;
    for (const [pattern, replacement] of rules){
        out = out.replace(pattern, replacement);
    }
    out = out.replace(/\s+/g, ' ').trim();
    if (out && !/[?.!]$/.test(out)) out += '?';
    return out.charAt(0).toUpperCase() + out.slice(1);
}
/** Score for how droppable a question is when shortening. */ function droppableScore(q, index, total) {
    let score = 0;
    if (!q.required) score += 3;
    if (q.type === 'long_text') score += 2;
    if (q.type === 'short_text') score += 1;
    if (q.type === 'nps') score -= 5; // NPS is usually the headline metric
    if (index > total * 0.6) score += 1; // later questions are lower value
    return score;
}
function buildRefineOperations(survey, parse, instruction) {
    const list = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey);
    switch(parse.intent){
        case 'shorten':
            {
                const total = list.length;
                if (total <= 5) {
                    return {
                        operations: [],
                        note: 'This survey is already short — removing more would lose signal.'
                    };
                }
                // Drop roughly a third, worst-value first.
                const targetCount = Math.max(5, Math.round(total * 0.65));
                const toDrop = list.map((entry, i)=>({
                        id: entry.question.id,
                        score: droppableScore(entry.question, i, total)
                    })).filter((x)=>x.score > 0).sort((a, b)=>b.score - a.score).slice(0, total - targetCount);
                if (!toDrop.length) {
                    return {
                        operations: [],
                        note: 'Every remaining question looks essential — nothing safe to cut.'
                    };
                }
                return {
                    operations: toDrop.map((x)=>({
                            operation: 'delete_question',
                            questionId: x.id
                        }))
                };
            }
        case 'lengthen':
            {
                const section = survey.sections[survey.sections.length - 1];
                if (!section) return {
                    operations: [],
                    note: 'No section to add to.'
                };
                return {
                    operations: [
                        {
                            operation: 'add_question',
                            sectionId: section.id,
                            question: {
                                type: 'long_text',
                                text: 'What could we do to improve your experience?',
                                required: false
                            }
                        },
                        {
                            operation: 'add_question',
                            sectionId: section.id,
                            question: {
                                type: 'rating',
                                text: 'How likely are you to use us again?',
                                required: false,
                                scale: {
                                    min: 1,
                                    max: 5,
                                    minLabel: 'Very unlikely',
                                    maxLabel: 'Very likely'
                                }
                            }
                        }
                    ]
                };
            }
        case 'professional':
        case 'simplify':
            {
                const rules = parse.intent === 'professional' ? PROFESSIONAL_REPLACEMENTS : SIMPLIFY_REPLACEMENTS;
                const scoped = parse.questionNumber ? [
                    questionAt(survey, parse.questionNumber)
                ].filter((q)=>q !== null) : list.map((l)=>l.question);
                const operations = [];
                for (const q of scoped){
                    const next = rewrite(q.text, rules);
                    if (next !== q.text) {
                        operations.push({
                            operation: 'update_question',
                            questionId: q.id,
                            changes: {
                                text: next
                            }
                        });
                    }
                }
                if (!operations.length) {
                    return {
                        operations: [],
                        note: parse.intent === 'professional' ? 'The wording already reads professionally.' : 'The wording is already clear and simple.'
                    };
                }
                return {
                    operations
                };
            }
        case 'dedupe':
            {
                // Reuse the review detector so dedupe and review always agree.
                const review = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ai$2f$mock$2f$review$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["reviewSurveyLocal"])(survey);
                const dupes = review.issues.filter((i)=>i.type === 'duplicate_question');
                if (!dupes.length) {
                    return {
                        operations: [],
                        note: 'No duplicate questions found.'
                    };
                }
                return {
                    operations: dupes.flatMap((i)=>i.fixes[0]?.operations ?? [])
                };
            }
        case 'change_type':
            {
                const q = questionAt(survey, parse.questionNumber);
                if (!q) {
                    return {
                        operations: [],
                        note: parse.questionNumber ? `There is no Q${parse.questionNumber} in this survey.` : 'Tell me which question to change, e.g. “change Q5 to a 1–10 rating”.'
                    };
                }
                const type = parse.targetType ?? 'rating';
                const changes = {
                    type
                };
                if (type === 'nps') {
                    changes.scale = {
                        min: 0,
                        max: 10,
                        minLabel: 'Not at all likely',
                        maxLabel: 'Extremely likely'
                    };
                    changes.options = undefined;
                } else if (type === 'rating') {
                    changes.scale = {
                        min: 1,
                        max: 5,
                        minLabel: 'Very dissatisfied',
                        maxLabel: 'Very satisfied'
                    };
                    changes.options = undefined;
                } else if (type === 'single_select') {
                    changes.options = [
                        'Very satisfied',
                        'Satisfied',
                        'Neutral',
                        'Dissatisfied',
                        'Very dissatisfied'
                    ].map((label)=>({
                            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('opt'),
                            label
                        }));
                    changes.scale = undefined;
                } else {
                    changes.options = undefined;
                    changes.scale = undefined;
                }
                return {
                    operations: [
                        {
                            operation: 'update_question',
                            questionId: q.id,
                            changes
                        }
                    ]
                };
            }
        case 'improve_question':
            {
                const q = questionAt(survey, parse.questionNumber);
                if (!q) {
                    return {
                        operations: [],
                        note: `There is no Q${parse.questionNumber} in this survey.`
                    };
                }
                const improved = rewrite(q.text, [
                    ...PROFESSIONAL_REPLACEMENTS,
                    ...SIMPLIFY_REPLACEMENTS
                ]);
                if (improved === q.text) {
                    return {
                        operations: [],
                        note: 'That question already reads well.'
                    };
                }
                return {
                    operations: [
                        {
                            operation: 'update_question',
                            questionId: q.id,
                            changes: {
                                text: improved
                            }
                        }
                    ]
                };
            }
        case 'add_followup':
        case 'add_logic':
            {
                // Anchor on the referenced question, else the first scored question.
                const anchor = questionAt(survey, parse.questionNumber) ?? list.find((l)=>l.question.type === 'rating' || l.question.type === 'nps')?.question;
                if (!anchor) {
                    return {
                        operations: [],
                        note: 'Add a rating or NPS question first — conditional logic needs a score to branch on.'
                    };
                }
                const section = survey.sections.find((s)=>s.questions.some((q)=>q.id === anchor.id)) ?? survey.sections[0];
                if (!section) return {
                    operations: [],
                    note: 'No section to add to.'
                };
                const followUpId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('q');
                const threshold = parse.threshold ?? 3;
                const index = section.questions.findIndex((q)=>q.id === anchor.id) + 1 || undefined;
                return {
                    operations: [
                        {
                            operation: 'add_question',
                            sectionId: section.id,
                            index,
                            question: {
                                id: followUpId,
                                type: 'long_text',
                                text: 'Why were you dissatisfied?',
                                helpText: 'Shown only to respondents who gave a low score.',
                                required: false
                            }
                        },
                        {
                            operation: 'add_logic',
                            logic: {
                                questionId: anchor.id,
                                operator: 'less_than',
                                value: threshold,
                                action: 'show_question',
                                targetId: followUpId
                            }
                        }
                    ]
                };
            }
        default:
            {
                return {
                    operations: [],
                    note: `I couldn't map “${instruction.trim()}” to a change I know how to make. Try “make this shorter”, “remove duplicate questions”, “change Q5 to a 1–10 rating”, or “if someone rates below 3, ask why”.`
                };
            }
    }
}
}),
"[project]/lib/ai/mock/review.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — survey quality analysis.
 *
 * Real heuristics over the actual survey, not canned output: the health score
 * is computed from the issues found, so fixing an issue genuinely raises the
 * score. Shared by the Mock provider and used to sanity-check Claude's review.
 *
 * Each detector returns issues carrying precomputed `operations`, so applying
 * a fix needs no second AI round-trip.
 */ __turbopack_context__.s([
    "reviewSurveyLocal",
    ()=>reviewSurveyLocal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/survey/helpers.ts [app-route] (ecmascript)");
;
;
/** Conjunctions that signal a question asking two things at once. */ const DOUBLE_BARRELLED = /\b(\w+)\s+and\s+(?:the\s+)?(\w+)\b/i;
/** Phrasings that push the respondent toward an answer. */ const LEADING_PATTERNS = [
    /\bdon'?t you (?:agree|think|feel)\b/i,
    /\bwouldn'?t you (?:agree|say|think)\b/i,
    /\bhow (?:great|amazing|excellent|wonderful|fantastic)\b/i,
    /\byou (?:must|surely) (?:agree|have)\b/i,
    /\bisn'?t it (?:true|clear|obvious)\b/i,
    /\bexceptionally\b/i
];
/** Vague frequency words that overlap when used together. */ const VAGUE_FREQUENCY = [
    'often',
    'sometimes',
    'frequently',
    'occasionally',
    'regularly'
];
/**
 * Stable id for an issue or fix.
 *
 * Review runs are stateless and repeated (the server re-reviews to resolve a
 * fix against the live survey), so ids MUST be derived from content rather
 * than a counter — otherwise the client's issue id never matches the
 * server's and every fix is rejected.
 */ function stableId(prefix, ...parts) {
    const input = parts.join('|');
    let h1 = 0x811c9dc5;
    for(let i = 0; i < input.length; i += 1){
        h1 ^= input.charCodeAt(i);
        h1 = Math.imul(h1, 0x01000193) >>> 0;
    }
    return `${prefix}_${h1.toString(36)}`;
}
/**
 * Function words only. Intent-bearing words ("satisfied", "recommend",
 * "quality") are deliberately KEPT — they are what makes two questions
 * near-duplicates, so stripping them would blind the detector.
 */ const STOPWORDS = new Set([
    'how',
    'what',
    'the',
    'a',
    'an',
    'are',
    'is',
    'was',
    'were',
    'you',
    'your',
    'with',
    'our',
    'to',
    'of',
    'and',
    'or',
    'do',
    'did',
    'for',
    'in',
    'on',
    'at',
    'be',
    'been',
    'it',
    'that',
    'this',
    'would',
    'could',
    'have',
    'has',
    'about',
    'us',
    'we',
    'their',
    'there',
    'from',
    'any',
    'all',
    'been'
]);
function contentWords(text) {
    return new Set(text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w)=>w.length > 2 && !STOPWORDS.has(w)));
}
/** Jaccard similarity over content words. */ function similarity(a, b) {
    const sa = contentWords(a);
    const sb = contentWords(b);
    if (!sa.size || !sb.size) return 0;
    let shared = 0;
    for (const w of sa)if (sb.has(w)) shared += 1;
    return shared / (sa.size + sb.size - shared);
}
/** Splits a double-barrelled question into two focused questions. */ function splitText(text) {
    const m = text.match(DOUBLE_BARRELLED);
    if (!m) return null;
    const idx = text.toLowerCase().indexOf(' and ');
    if (idx === -1) return null;
    const head = text.slice(0, idx).trim();
    let tail = text.slice(idx + 5).trim();
    // "How satisfied are you with X and Y?" -> stem is everything up to X.
    const stemMatch = head.match(/^(.*\b(?:with|about|of|the)\b\s*)(.+)$/i);
    if (!stemMatch) return null;
    const stem = stemMatch[1];
    const first = stemMatch[2].replace(/[?.!]+$/, '').trim();
    tail = tail.replace(/[?.!]+$/, '').trim();
    if (!first || !tail) return null;
    const q = text.trim().endsWith('?') ? '?' : '';
    const cap = (s)=>s.charAt(0).toUpperCase() + s.slice(1);
    return [
        `${cap(stem)}${first}${q}`,
        `${cap(stem)}${tail}${q}`
    ];
}
function cloneWithText(question, text) {
    const { id: _id, ...rest } = question;
    return {
        ...rest,
        text
    };
}
/* -------------------------------------------------------------------------- */ /* Detectors                                                                  */ /* -------------------------------------------------------------------------- */ function detectDoubleBarrelled(survey) {
    const issues = [];
    for (const { question } of (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey)){
        if (!DOUBLE_BARRELLED.test(question.text)) continue;
        const parts = splitText(question.text);
        if (!parts) continue;
        const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(survey, question.id);
        const fixes = [
            {
                id: stableId('fix', 'split', question.id),
                summary: 'Split into two focused questions.',
                actionLabel: 'Apply Fix',
                before: question.text,
                after: parts,
                operations: [
                    {
                        operation: 'split_question',
                        questionId: question.id,
                        replacements: [
                            cloneWithText(question, parts[0]),
                            cloneWithText(question, parts[1])
                        ]
                    }
                ]
            }
        ];
        issues.push({
            id: stableId('iss', 'double_barrelled', question.id),
            type: 'double_barrelled',
            severity: 'high',
            questionId: question.id,
            message: `Q${n} may be a double-barrelled question`,
            rationale: 'It asks about two different things at once, so a single answer cannot tell you which one drove the score.',
            fixes
        });
    }
    return issues;
}
function detectLeading(survey) {
    const issues = [];
    for (const { question } of (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey)){
        if (!LEADING_PATTERNS.some((p)=>p.test(question.text))) continue;
        const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(survey, question.id);
        // Rewrite to a neutral formulation.
        const neutral = question.text.replace(/^don'?t you agree that\s*/i, 'How would you rate ').replace(/^wouldn'?t you agree (?:that\s*)?/i, 'How would you rate ').replace(/\bexceptionally\s*/gi, '').replace(/\bour ([\w\s]+?) team was\b/i, 'our $1 team').replace(/\bthe new interface is a big improvement\b/i, 'the new interface').replace(/\s+/g, ' ').trim();
        const rewritten = neutral.endsWith('?') ? neutral : `${neutral}?`;
        issues.push({
            id: stableId('iss', 'leading_question', question.id),
            type: 'leading_question',
            severity: 'high',
            questionId: question.id,
            message: `Q${n} is a leading question`,
            rationale: 'The wording signals the answer you expect, which biases responses upward and inflates your results.',
            fixes: [
                {
                    id: stableId('fix', 'neutral', question.id),
                    summary: 'Rewrite in neutral wording.',
                    actionLabel: 'Apply Fix',
                    before: question.text,
                    after: [
                        rewritten
                    ],
                    operations: [
                        {
                            operation: 'update_question',
                            questionId: question.id,
                            changes: {
                                text: rewritten
                            }
                        }
                    ]
                }
            ]
        });
    }
    return issues;
}
function detectDuplicates(survey) {
    const issues = [];
    const list = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey);
    const flagged = new Set();
    for(let i = 0; i < list.length; i += 1){
        for(let j = i + 1; j < list.length; j += 1){
            const a = list[i].question;
            const b = list[j].question;
            if (flagged.has(b.id)) continue;
            if (similarity(a.text, b.text) < 0.6) continue;
            flagged.add(b.id);
            const na = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(survey, a.id);
            const nb = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(survey, b.id);
            issues.push({
                id: stableId('iss', 'duplicate_question', b.id, a.id),
                type: 'duplicate_question',
                severity: 'medium',
                questionId: b.id,
                relatedQuestionIds: [
                    a.id
                ],
                message: `Q${nb} is very similar to Q${na}`,
                rationale: 'Near-duplicate questions lengthen the survey without adding insight, and split your data across two fields.',
                fixes: [
                    {
                        id: stableId('fix', 'dedupe', b.id),
                        summary: `Remove Q${nb} and keep Q${na}.`,
                        actionLabel: 'Remove',
                        before: b.text,
                        operations: [
                            {
                                operation: 'delete_question',
                                questionId: b.id
                            }
                        ]
                    }
                ]
            });
        }
    }
    return issues;
}
function detectPoorOptions(survey) {
    const issues = [];
    for (const { question } of (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey)){
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isChoiceType"])(question.type) || !question.options) continue;
        const labels = question.options.map((o)=>o.label.toLowerCase());
        const vague = labels.filter((l)=>VAGUE_FREQUENCY.includes(l.trim()));
        const hasOverlap = vague.length >= 2;
        // Duplicate labels are always a defect.
        const dupes = labels.filter((l, i)=>labels.indexOf(l) !== i);
        if (!hasOverlap && !dupes.length) continue;
        const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(survey, question.id);
        const reason = hasOverlap ? 'Options like “often” and “sometimes” overlap, so respondents interpret them differently.' : 'The option list repeats a value, which makes the results ambiguous.';
        // Replace with a mutually exclusive frequency scale.
        const replacement = hasOverlap ? [
            'Daily',
            'A few times a week',
            'Weekly',
            'Monthly',
            'Less than monthly'
        ] : Array.from(new Set(question.options.map((o)=>o.label)));
        issues.push({
            id: stableId('iss', 'poor_answer_choices', question.id),
            type: 'poor_answer_choices',
            severity: 'medium',
            questionId: question.id,
            message: `Q${n} has overlapping answer choices`,
            rationale: reason,
            fixes: [
                {
                    id: stableId('fix', 'options', question.id),
                    summary: 'Replace with mutually exclusive options.',
                    actionLabel: 'Apply Fix',
                    before: question.options.map((o)=>o.label).join(' · '),
                    after: [
                        replacement.join(' · ')
                    ],
                    operations: [
                        {
                            operation: 'update_question',
                            questionId: question.id,
                            changes: {
                                options: replacement.map((label)=>({
                                        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('opt'),
                                        label
                                    }))
                            }
                        }
                    ]
                }
            ]
        });
    }
    return issues;
}
function detectLength(survey) {
    const total = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey).length;
    const minutes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["estimateMinutes"])(survey);
    const target = survey.meta.estimatedMinutes;
    // Only flag when it is genuinely long, or overruns a stated constraint.
    const overTarget = typeof target === 'number' && minutes > target;
    if (total <= 20 && !overTarget) return [];
    return [
        {
            id: stableId('iss', 'excessive_length', String(total)),
            type: 'excessive_length',
            severity: overTarget ? 'medium' : 'low',
            message: overTarget ? `Survey runs ~${minutes} min, over the ${target} min target` : `Survey has ${total} questions (~${minutes} min)`,
            rationale: 'Completion rates drop sharply on long surveys. Cutting low-value questions protects your response rate.',
            fixes: [
                {
                    id: stableId('fix', 'shorten'),
                    summary: 'Ask Copilot to shorten the survey.',
                    actionLabel: 'Shorten'
                }
            ]
        }
    ];
}
function detectMissingFollowup(survey) {
    const scored = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey).filter((q)=>q.question.type === 'rating' || q.question.type === 'nps');
    if (!scored.length) return [];
    // If any rating question already drives logic, there is a follow-up path.
    const hasLogic = survey.logic.some((l)=>scored.some((s)=>s.question.id === l.questionId));
    if (hasLogic) return [];
    const anchor = scored[0].question;
    const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(survey, anchor.id);
    return [
        {
            id: stableId('iss', 'missing_followup', anchor.id),
            type: 'missing_followup',
            severity: 'low',
            questionId: anchor.id,
            message: 'Consider adding a follow-up for low scores',
            rationale: 'A low rating tells you there is a problem but not what it is. An open follow-up captures the reason while it is fresh.',
            fixes: [
                {
                    id: stableId('fix', 'followup', anchor.id),
                    summary: `Add an open follow-up when Q${n} is below 3.`,
                    actionLabel: 'Add',
                    operations: [
                        {
                            operation: 'add_question',
                            sectionId: survey.sections.find((s)=>s.questions.some((q)=>q.id === anchor.id))?.id ?? survey.sections[0]?.id ?? '',
                            question: {
                                type: 'long_text',
                                text: 'What was the main reason for your score?',
                                required: false
                            }
                        }
                    ]
                }
            ]
        }
    ];
}
/* -------------------------------------------------------------------------- */ /* Scoring                                                                    */ /* -------------------------------------------------------------------------- */ function gradeFor(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 55) return 'fair';
    return 'poor';
}
/**
 * Derives the health score from the issues actually found.
 *
 * Each sub-score starts at 100 and is penalised per relevant issue, so the
 * number always has a traceable cause and improves when issues are fixed.
 */ function computeHealth(survey, issues) {
    const total = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["allQuestions"])(survey).length;
    const minutes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["estimateMinutes"])(survey);
    const count = (types)=>issues.filter((i)=>types.includes(i.type)).length;
    const clarityHits = count([
        'double_barrelled',
        'leading_question',
        'confusing_wording'
    ]);
    const structureHits = count([
        'duplicate_question',
        'poor_answer_choices'
    ]);
    const lengthHits = count([
        'excessive_length'
    ]);
    const coverageHits = count([
        'missing_followup',
        'unnecessary_question'
    ]);
    const clamp = (n)=>Math.max(0, Math.min(100, Math.round(n)));
    const clarity = clamp(100 - clarityHits * 18);
    const structure = clamp(100 - structureHits * 14);
    const length = clamp(100 - lengthHits * 20 - Math.max(0, minutes - 8) * 3);
    const coverage = clamp(100 - coverageHits * 12);
    // Weighted: clarity matters most for data quality.
    const score = clamp(clarity * 0.4 + structure * 0.25 + length * 0.15 + coverage * 0.2);
    // Checks are per-question quality gates plus survey-level ones.
    const checksTotal = total * 3 + 4;
    const checksPassed = Math.max(0, checksTotal - issues.length);
    const grade = gradeFor(score);
    const critical = issues.filter((i)=>i.severity === 'high').length;
    const summary = critical ? `${critical} issue${critical === 1 ? '' : 's'} to resolve before publishing.` : issues.length ? 'Solid survey with a few improvements available.' : 'No issues found — this survey is ready to publish.';
    return {
        score,
        grade,
        clarity,
        structure,
        length,
        coverage,
        checksPassed,
        checksTotal,
        summary
    };
}
function reviewSurveyLocal(survey) {
    const issues = [
        ...detectDoubleBarrelled(survey),
        ...detectLeading(survey),
        ...detectDuplicates(survey),
        ...detectPoorOptions(survey),
        ...detectLength(survey),
        ...detectMissingFollowup(survey)
    ];
    // High severity first so the UI surfaces what matters most.
    const order = {
        high: 0,
        medium: 1,
        low: 2
    };
    issues.sort((a, b)=>order[a.severity] - order[b.severity]);
    return {
        health: computeHealth(survey, issues),
        issues
    };
}
}),
"[project]/lib/ai/mock/scenarios.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — Mock AI scenario library.
 *
 * Realistic Experience.com-style survey blueprints used when no API key is
 * configured. Each scenario declares keyword groups so intent matching works
 * across many phrasings rather than one hardcoded sentence (see match.ts).
 *
 * Blueprints are plain data with no ids; ids are minted at build time so
 * every generated survey gets fresh ones.
 */ __turbopack_context__.s([
    "FEATURED_TEMPLATES",
    ()=>FEATURED_TEMPLATES,
    "SCENARIOS",
    ()=>SCENARIOS
]);
const SATISFACTION_5 = [
    'Very satisfied',
    'Satisfied',
    'Neutral',
    'Dissatisfied',
    'Very dissatisfied'
];
const NPS_SCALE = {
    min: 0,
    max: 10,
    minLabel: 'Not at all likely',
    maxLabel: 'Extremely likely'
};
const RATING_5 = {
    min: 1,
    max: 5,
    minLabel: 'Very dissatisfied',
    maxLabel: 'Very satisfied'
};
const SCENARIOS = [
    {
        key: 'hotel',
        label: 'Hotel Guest Satisfaction',
        title: 'Hotel Guest Satisfaction Survey',
        description: 'Help us understand your recent stay so we can keep improving the guest experience.',
        keywords: [
            [
                'hotel',
                'resort',
                'motel',
                'lodging',
                'accommodation'
            ],
            [
                'guest',
                'stay',
                'stayed',
                'staying',
                'room',
                'check-in',
                'checkin'
            ],
            [
                'hospitality',
                'front desk',
                'housekeeping'
            ]
        ],
        sections: [
            {
                title: 'Your Stay',
                description: 'A few quick questions about your visit.',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied were you with your overall stay?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'What was the main purpose of your stay?',
                        options: [
                            'Business',
                            'Leisure',
                            'Family visit',
                            'Event or conference',
                            'Other'
                        ]
                    }
                ]
            },
            {
                title: 'Room & Facilities',
                questions: [
                    {
                        type: 'rating',
                        text: 'How would you rate the cleanliness of your room?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'rating',
                        text: 'How satisfied were you with the room comfort and the hotel facilities?',
                        flaw: 'double_barrelled',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'multi_select',
                        text: 'Which facilities did you use during your stay?',
                        options: [
                            'Restaurant',
                            'Bar',
                            'Gym',
                            'Pool',
                            'Spa',
                            'Business centre',
                            'None of these'
                        ]
                    }
                ]
            },
            {
                title: 'Service',
                questions: [
                    {
                        type: 'rating',
                        text: 'How would you rate the helpfulness of our staff?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: "Don't you agree that our front desk team was exceptionally friendly?",
                        flaw: 'leading',
                        options: SATISFACTION_5
                    }
                ]
            },
            {
                title: 'Recommendation',
                questions: [
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend our hotel to a friend or colleague?',
                        required: true,
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'What could we do to make your next stay better?'
                    }
                ]
            }
        ]
    },
    {
        key: 'post_purchase',
        label: 'Post-Purchase Experience',
        title: 'Post-Purchase Customer Experience Survey',
        description: 'Tell us about your recent order so we can improve every step, from checkout to delivery.',
        keywords: [
            [
                'post-purchase',
                'post purchase',
                'after purchase',
                'postpurchase'
            ],
            [
                'order',
                'ordered',
                'purchase',
                'purchased',
                'bought',
                'checkout'
            ],
            [
                'delivery',
                'shipping',
                'shipment',
                'arrived',
                'packaging'
            ],
            [
                'ecommerce',
                'e-commerce',
                'online store'
            ]
        ],
        sections: [
            {
                title: 'Overall Experience',
                description: 'Start with the big picture.',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied were you with your overall purchase experience?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'How easy was it to find what you were looking for?',
                        options: [
                            'Very easy',
                            'Easy',
                            'Neither easy nor difficult',
                            'Difficult',
                            'Very difficult'
                        ]
                    },
                    {
                        type: 'single_select',
                        text: 'How often do you shop with us?',
                        flaw: 'poor_options',
                        options: [
                            'Daily',
                            'Weekly',
                            'Often',
                            'Sometimes',
                            'Rarely'
                        ]
                    }
                ]
            },
            {
                title: 'Delivery',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied were you with the delivery speed?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'Did your order arrive when you expected it?',
                        options: [
                            'Arrived early',
                            'Arrived on time',
                            'Arrived slightly late',
                            'Arrived very late',
                            'It has not arrived'
                        ]
                    },
                    {
                        type: 'rating',
                        text: 'How satisfied were you with the condition of the packaging?',
                        scale: RATING_5
                    }
                ]
            },
            {
                title: 'Product Quality',
                questions: [
                    {
                        type: 'rating',
                        text: 'How would you rate the quality of the product you received?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'Did the product match its description on our website?',
                        options: [
                            'Exactly as described',
                            'Mostly as described',
                            'Somewhat different',
                            'Very different'
                        ]
                    },
                    {
                        type: 'rating',
                        text: 'How would you rate the quality of the product you ordered?',
                        flaw: 'duplicate',
                        scale: RATING_5
                    }
                ]
            },
            {
                title: 'Customer Support',
                questions: [
                    {
                        type: 'boolean',
                        text: 'Did you contact our customer support team about this order?',
                        options: [
                            'Yes',
                            'No'
                        ]
                    },
                    {
                        type: 'rating',
                        text: 'How satisfied are you with our product and customer service?',
                        flaw: 'double_barrelled',
                        scale: RATING_5
                    },
                    {
                        type: 'rating',
                        text: 'How satisfied were you with the customer service you received?',
                        flaw: 'duplicate',
                        scale: RATING_5
                    }
                ]
            },
            {
                title: 'Recommendation',
                questions: [
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend us to a friend or colleague?',
                        required: true,
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'Is there anything else you would like us to know?'
                    }
                ]
            }
        ]
    },
    {
        key: 'customer_satisfaction',
        label: 'Customer Satisfaction',
        title: 'Customer Satisfaction Survey',
        description: 'Measure customer happiness and identify the areas that matter most.',
        keywords: [
            [
                'csat',
                'customer satisfaction',
                'satisfaction'
            ],
            [
                'customer',
                'client',
                'happy',
                'happiness'
            ],
            [
                'experience',
                'overall'
            ]
        ],
        sections: [
            {
                title: 'Overview',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied are you with our company overall?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'How long have you been a customer?',
                        options: [
                            'Less than 6 months',
                            '6–12 months',
                            '1–3 years',
                            'More than 3 years'
                        ]
                    }
                ]
            },
            {
                title: 'Experience',
                questions: [
                    {
                        type: 'rating',
                        text: 'How easy is it to do business with us?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'How would you rate the value for money of our offering?',
                        options: [
                            'Excellent value',
                            'Good value',
                            'Fair value',
                            'Poor value'
                        ]
                    },
                    {
                        type: 'single_select',
                        text: 'How often do you use our product?',
                        flaw: 'poor_options',
                        options: [
                            'Daily',
                            'Weekly',
                            'Often',
                            'Sometimes',
                            'Rarely'
                        ]
                    }
                ]
            },
            {
                title: 'Feedback',
                questions: [
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend us to a friend or colleague?',
                        required: true,
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'What is the one thing we could do better?'
                    }
                ]
            }
        ]
    },
    {
        key: 'support',
        label: 'Customer Support Experience',
        title: 'Customer Support Experience Survey',
        description: 'Tell us how your recent support interaction went so we can improve our service.',
        keywords: [
            [
                'support',
                'helpdesk',
                'help desk',
                'service desk',
                'ticket'
            ],
            [
                'agent',
                'representative',
                'rep',
                'call',
                'chat',
                'contacted'
            ],
            [
                'resolution',
                'resolved',
                'issue',
                'complaint'
            ]
        ],
        sections: [
            {
                title: 'Your Request',
                questions: [
                    {
                        type: 'single_select',
                        text: 'How did you contact our support team?',
                        required: true,
                        options: [
                            'Phone',
                            'Email',
                            'Live chat',
                            'Help centre',
                            'Social media'
                        ]
                    },
                    {
                        type: 'single_select',
                        text: 'Was your issue resolved?',
                        required: true,
                        options: [
                            'Fully resolved',
                            'Partly resolved',
                            'Not resolved',
                            'Still in progress'
                        ]
                    }
                ]
            },
            {
                title: 'Service Quality',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied were you with the support you received?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'rating',
                        text: 'How would you rate the knowledge and the speed of our agent?',
                        flaw: 'double_barrelled',
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'How many times did you have to contact us about this issue?',
                        options: [
                            'Once',
                            'Twice',
                            'Three times',
                            'More than three times'
                        ]
                    }
                ]
            },
            {
                title: 'Feedback',
                questions: [
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend our support to others?',
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'How could we have handled your request better?'
                    }
                ]
            }
        ]
    },
    {
        key: 'employee',
        label: 'Employee Engagement',
        title: 'Employee Engagement Survey',
        description: 'Understand how our people feel about their work, their team and their growth.',
        keywords: [
            [
                'employee',
                'staff',
                'workforce',
                'colleague',
                'team member'
            ],
            [
                'engagement',
                'engaged',
                'morale',
                'culture',
                'workplace'
            ],
            [
                'manager',
                'hr',
                'internal',
                'onboarding',
                'retention'
            ]
        ],
        sections: [
            {
                title: 'Engagement',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied are you with your role overall?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend this company as a place to work?',
                        required: true,
                        scale: NPS_SCALE
                    }
                ]
            },
            {
                title: 'Work & Team',
                questions: [
                    {
                        type: 'rating',
                        text: 'How supported do you feel by your manager?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'rating',
                        text: 'How satisfied are you with your workload and your work-life balance?',
                        flaw: 'double_barrelled',
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'Do you have the tools you need to do your job well?',
                        options: [
                            'Always',
                            'Most of the time',
                            'Sometimes',
                            'Rarely',
                            'Never'
                        ]
                    }
                ]
            },
            {
                title: 'Growth',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied are you with your opportunities to grow here?',
                        scale: RATING_5
                    },
                    {
                        type: 'long_text',
                        text: 'What would make this a better place to work?'
                    }
                ]
            }
        ]
    },
    {
        key: 'product',
        label: 'Product Feedback',
        title: 'Product Feedback Survey',
        description: 'Gather insights about how our product is working for you and what to build next.',
        keywords: [
            [
                'product',
                'feature',
                'features',
                'app',
                'platform',
                'software'
            ],
            [
                'usability',
                'roadmap',
                'release',
                'beta',
                'ux'
            ],
            [
                'feedback',
                'improve'
            ]
        ],
        sections: [
            {
                title: 'Overall',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied are you with the product overall?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'How often do you use the product?',
                        required: true,
                        options: [
                            'Daily',
                            'A few times a week',
                            'Weekly',
                            'Monthly',
                            'Less than monthly'
                        ]
                    }
                ]
            },
            {
                title: 'Usability',
                questions: [
                    {
                        type: 'rating',
                        text: 'How easy is the product to use?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'multi_select',
                        text: 'Which features do you use most?',
                        options: [
                            'Dashboards',
                            'Reporting',
                            'Integrations',
                            'Automation',
                            'Mobile app',
                            'Notifications'
                        ]
                    },
                    {
                        type: 'single_select',
                        text: "Wouldn't you agree the new interface is a big improvement?",
                        flaw: 'leading',
                        options: SATISFACTION_5
                    }
                ]
            },
            {
                title: 'Feedback',
                questions: [
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend this product to a colleague?',
                        required: true,
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'What single improvement would help you most?'
                    }
                ]
            }
        ]
    },
    {
        key: 'restaurant',
        label: 'Restaurant Feedback',
        title: 'Restaurant Experience Survey',
        description: 'Tell us about your visit so we can keep the food and service at their best.',
        keywords: [
            [
                'restaurant',
                'cafe',
                'café',
                'diner',
                'bistro',
                'eatery'
            ],
            [
                'food',
                'meal',
                'menu',
                'dining',
                'dine',
                'waiter',
                'server'
            ],
            [
                'reservation',
                'table',
                'takeaway',
                'takeout'
            ]
        ],
        sections: [
            {
                title: 'Your Visit',
                questions: [
                    {
                        type: 'rating',
                        text: 'How would you rate your overall dining experience?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'Which meal did you visit us for?',
                        options: [
                            'Breakfast',
                            'Lunch',
                            'Dinner',
                            'Drinks only'
                        ]
                    }
                ]
            },
            {
                title: 'Food & Service',
                questions: [
                    {
                        type: 'rating',
                        text: 'How would you rate the quality of the food?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'rating',
                        text: 'How would you rate the food quality and the speed of service?',
                        flaw: 'double_barrelled',
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'How long did you wait to be seated?',
                        options: [
                            'No wait',
                            'Under 10 minutes',
                            '10–20 minutes',
                            'More than 20 minutes'
                        ]
                    }
                ]
            },
            {
                title: 'Recommendation',
                questions: [
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend us to a friend?',
                        required: true,
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'What did you enjoy most about your visit?'
                    }
                ]
            }
        ]
    },
    {
        key: 'event',
        label: 'Event Feedback',
        title: 'Event Feedback Survey',
        description: 'Collect feedback from attendees to make our next event even better.',
        keywords: [
            [
                'event',
                'conference',
                'webinar',
                'summit',
                'workshop',
                'meetup'
            ],
            [
                'attendee',
                'attended',
                'session',
                'speaker',
                'venue',
                'agenda'
            ],
            [
                'registration',
                'keynote'
            ]
        ],
        sections: [
            {
                title: 'Overall',
                questions: [
                    {
                        type: 'rating',
                        text: 'How would you rate the event overall?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'Was this your first time attending?',
                        options: [
                            'Yes, first time',
                            'No, I have attended before'
                        ]
                    }
                ]
            },
            {
                title: 'Content',
                questions: [
                    {
                        type: 'rating',
                        text: 'How relevant was the content to your work?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'multi_select',
                        text: 'Which sessions did you find most valuable?',
                        options: [
                            'Keynote',
                            'Product sessions',
                            'Panel discussions',
                            'Workshops',
                            'Networking'
                        ]
                    }
                ]
            },
            {
                title: 'Logistics',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied were you with the venue and the catering?',
                        flaw: 'double_barrelled',
                        scale: RATING_5
                    },
                    {
                        type: 'nps',
                        text: 'How likely are you to attend our next event?',
                        required: true,
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'What would you like to see at our next event?'
                    }
                ]
            }
        ]
    },
    {
        key: 'healthcare',
        label: 'Patient Experience',
        title: 'Patient Experience Survey',
        description: 'Your feedback helps us improve the care and service we provide.',
        keywords: [
            [
                'patient',
                'healthcare',
                'health care',
                'clinic',
                'hospital'
            ],
            [
                'doctor',
                'nurse',
                'appointment',
                'treatment',
                'care',
                'medical'
            ],
            [
                'practice',
                'surgery',
                'consultation'
            ]
        ],
        sections: [
            {
                title: 'Your Visit',
                questions: [
                    {
                        type: 'rating',
                        text: 'How would you rate your overall experience with us?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'How easy was it to book your appointment?',
                        required: true,
                        options: [
                            'Very easy',
                            'Easy',
                            'Neither easy nor difficult',
                            'Difficult',
                            'Very difficult'
                        ]
                    }
                ]
            },
            {
                title: 'Care',
                questions: [
                    {
                        type: 'rating',
                        text: 'How well did your clinician listen to your concerns?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'rating',
                        text: 'How clearly was your treatment explained to you?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'How long did you wait past your appointment time?',
                        options: [
                            'Seen on time',
                            'Under 15 minutes',
                            '15–30 minutes',
                            'More than 30 minutes'
                        ]
                    }
                ]
            },
            {
                title: 'Feedback',
                questions: [
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend our practice to family or friends?',
                        required: true,
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'How could we improve your experience?'
                    }
                ]
            }
        ]
    },
    {
        key: 'nps',
        label: 'Net Promoter Score',
        title: 'Net Promoter Score Survey',
        description: 'A short survey to measure loyalty and understand what drives it.',
        keywords: [
            [
                'nps',
                'net promoter',
                'promoter score'
            ],
            [
                'loyalty',
                'recommend',
                'referral',
                'advocacy'
            ],
            [
                'short survey',
                'quick survey'
            ]
        ],
        sections: [
            {
                title: 'Recommendation',
                questions: [
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend us to a friend or colleague?',
                        required: true,
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'What is the main reason for your score?',
                        required: true
                    }
                ]
            },
            {
                title: 'Follow-up',
                questions: [
                    {
                        type: 'single_select',
                        text: 'Which area has the biggest impact on your score?',
                        options: [
                            'Product quality',
                            'Customer service',
                            'Value for money',
                            'Ease of use',
                            'Delivery experience'
                        ]
                    },
                    {
                        type: 'long_text',
                        text: 'What would it take to raise your score?'
                    }
                ]
            }
        ]
    },
    {
        key: 'service',
        label: 'Service Experience',
        title: 'Service Experience Survey',
        description: 'Tell us how our service measured up so we can keep raising the bar.',
        keywords: [
            [
                'service experience',
                'service quality',
                'field service'
            ],
            [
                'technician',
                'appointment',
                'installation',
                'repair',
                'visit'
            ],
            [
                'service',
                'serviced'
            ]
        ],
        sections: [
            {
                title: 'Overall',
                questions: [
                    {
                        type: 'rating',
                        text: 'How satisfied were you with the service you received?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'single_select',
                        text: 'Was the work completed on the first visit?',
                        required: true,
                        options: [
                            'Yes',
                            'No, it needed a follow-up visit',
                            'Not yet complete'
                        ]
                    }
                ]
            },
            {
                title: 'Our Team',
                questions: [
                    {
                        type: 'rating',
                        text: 'How would you rate the professionalism of our team?',
                        required: true,
                        scale: RATING_5
                    },
                    {
                        type: 'rating',
                        text: 'How satisfied were you with the punctuality and the tidiness of our team?',
                        flaw: 'double_barrelled',
                        scale: RATING_5
                    }
                ]
            },
            {
                title: 'Feedback',
                questions: [
                    {
                        type: 'nps',
                        text: 'How likely are you to recommend our service to others?',
                        required: true,
                        scale: NPS_SCALE
                    },
                    {
                        type: 'long_text',
                        text: 'Is there anything we could have done better?'
                    }
                ]
            }
        ]
    }
];
const FEATURED_TEMPLATES = [
    'customer_satisfaction',
    'post_purchase',
    'employee',
    'product',
    'nps',
    'event'
];
}),
"[project]/lib/ai/provider.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — AI provider interface and resolution.
 *
 * FOUNDATION ONLY. This module defines the contract and the selection rules.
 * The operations themselves are not implemented yet; both providers currently
 * return a `not_implemented` error.
 *
 * SERVER-ONLY. Nothing in lib/ai/ may be imported into a client component.
 * ANTHROPIC_API_KEY must never reach the browser. Route all access through a
 * server-side API route:
 *
 *   Browser -> Next.js route handler -> AIProvider -> Claude | Mock -> JSON
 */ __turbopack_context__.s([
    "aiError",
    ()=>aiError,
    "getProviderMode",
    ()=>getProviderMode,
    "hasApiKey",
    ()=>hasApiKey,
    "notImplemented",
    ()=>notImplemented,
    "resolveProviderName",
    ()=>resolveProviderName
]);
function getProviderMode() {
    const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
    if (raw === 'claude' || raw === 'mock' || raw === 'auto') return raw;
    return 'auto';
}
function hasApiKey() {
    return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
function resolveProviderName(mode = getProviderMode()) {
    if (mode === 'mock') return 'mock';
    if (mode === 'claude') return 'claude';
    return hasApiKey() ? 'claude' : 'mock';
}
function aiError(provider, code, message) {
    return {
        ok: false,
        provider,
        error: {
            code,
            message
        }
    };
}
function notImplemented(provider, operation) {
    return {
        ok: false,
        provider,
        error: {
            code: 'not_implemented',
            message: `${operation}() is not implemented yet (foundation stage).`
        }
    };
}
}),
"[project]/lib/survey/helpers.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "allQuestions",
    ()=>allQuestions,
    "defaultQuestion",
    ()=>defaultQuestion,
    "emailBodyFromText",
    ()=>emailBodyFromText,
    "emailBodyToText",
    ()=>emailBodyToText,
    "emptySurvey",
    ()=>emptySurvey,
    "estimateMinutes",
    ()=>estimateMinutes,
    "findEmail",
    ()=>findEmail,
    "findQuestion",
    ()=>findQuestion,
    "isChoiceType",
    ()=>isChoiceType,
    "isScaleType",
    ()=>isScaleType,
    "makeId",
    ()=>makeId,
    "makeOptions",
    ()=>makeOptions,
    "questionCount",
    ()=>questionCount,
    "questionNumber",
    ()=>questionNumber,
    "touch",
    ()=>touch,
    "withEmailDefaults",
    ()=>withEmailDefaults
]);
/**
 * Survey Copilot — survey traversal and construction helpers.
 *
 * Pure functions, safe on both server and client.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/survey.ts [app-route] (ecmascript)");
;
let counter = 0;
function makeId(prefix) {
    counter += 1;
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${counter.toString(36)}${rand}`;
}
function isChoiceType(type) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CHOICE_TYPES"].includes(type);
}
function isScaleType(type) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SCALE_TYPES"].includes(type);
}
function makeOptions(labels) {
    return labels.map((label)=>({
            id: makeId('opt'),
            label
        }));
}
function allQuestions(survey) {
    const out = [];
    let index = 0;
    for (const section of survey.sections){
        for (const question of section.questions){
            out.push({
                question,
                section,
                index
            });
            index += 1;
        }
    }
    return out;
}
function questionCount(survey) {
    return survey.sections.reduce((n, s)=>n + s.questions.length, 0);
}
function findQuestion(survey, questionId) {
    for (const section of survey.sections){
        const index = section.questions.findIndex((q)=>q.id === questionId);
        if (index !== -1) {
            return {
                question: section.questions[index],
                section,
                index
            };
        }
    }
    return null;
}
function questionNumber(survey, questionId) {
    const found = allQuestions(survey).find((q)=>q.question.id === questionId);
    return found ? found.index + 1 : 0;
}
function estimateMinutes(survey) {
    let seconds = 0;
    for (const { question } of allQuestions(survey)){
        if (question.type === 'long_text') seconds += 45;
        else if (question.type === 'short_text') seconds += 20;
        else if (isChoiceType(question.type)) seconds += 12;
        else seconds += 8;
    }
    return Math.max(1, Math.round(seconds / 60));
}
function defaultQuestion(type) {
    const base = {
        type,
        text: '',
        required: false
    };
    switch(type){
        case 'single_select':
        case 'dropdown':
            return {
                ...base,
                text: 'Untitled question',
                options: makeOptions([
                    'Option 1',
                    'Option 2',
                    'Option 3'
                ])
            };
        case 'multi_select':
            return {
                ...base,
                text: 'Untitled question',
                options: makeOptions([
                    'Option 1',
                    'Option 2',
                    'Option 3'
                ])
            };
        case 'boolean':
            return {
                ...base,
                text: 'Untitled question',
                options: makeOptions([
                    'Yes',
                    'No'
                ])
            };
        case 'rating':
            return {
                ...base,
                text: 'Untitled question',
                scale: {
                    min: 1,
                    max: 5,
                    minLabel: 'Very dissatisfied',
                    maxLabel: 'Very satisfied'
                }
            };
        case 'nps':
            return {
                ...base,
                text: 'How likely are you to recommend us to a friend or colleague?',
                scale: {
                    min: 0,
                    max: 10,
                    minLabel: 'Not at all likely',
                    maxLabel: 'Extremely likely'
                }
            };
        default:
            return {
                ...base,
                text: 'Untitled question'
            };
    }
}
function emptySurvey(title = 'Untitled Survey') {
    const now = new Date().toISOString();
    return {
        id: makeId('svy'),
        title,
        description: '',
        status: 'draft',
        sections: [
            {
                id: makeId('sec'),
                title: 'Section 1',
                questions: []
            }
        ],
        logic: [],
        emails: [],
        meta: {},
        createdAt: now,
        updatedAt: now
    };
}
function withEmailDefaults(survey) {
    return Array.isArray(survey.emails) ? survey : {
        ...survey,
        emails: []
    };
}
function findEmail(survey, kind) {
    return survey.emails?.find((e)=>e.kind === kind) ?? null;
}
function emailBodyToText(email) {
    return email.body.join('\n\n');
}
function emailBodyFromText(text) {
    return text.split(/\n{2,}/).map((p)=>p.trim()).filter(Boolean);
}
function touch(survey) {
    return {
        ...survey,
        updatedAt: new Date().toISOString()
    };
}
}),
"[project]/lib/survey/operations.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — operation validation and application.
 *
 * This is the trust boundary for AI output. The AI never mutates survey
 * state; it proposes `SurveyOperation`s, and every one is validated here
 * against the current survey before being applied. Anything malformed or
 * referencing a non-existent id is rejected with a reason and skipped —
 * a bad operation can never corrupt the survey or throw into the UI.
 *
 * Pure and immutable: `applyOperations` returns a new Survey.
 */ __turbopack_context__.s([
    "appliedChanges",
    ()=>appliedChanges,
    "applyOperations",
    ()=>applyOperations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/survey.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/survey/helpers.ts [app-route] (ecmascript)");
;
;
const VALID_TYPES = new Set(Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["QUESTION_TYPE_LABELS"]));
const VALID_OPERATORS = new Set([
    'equals',
    'not_equals',
    'less_than',
    'greater_than',
    'contains',
    'is_answered',
    'is_not_answered'
]);
const VALID_ACTIONS = new Set([
    'show_question',
    'hide_question',
    'skip_to_section',
    'end_survey'
]);
/** Narrow unknown AI output to a question, filling ids and dropping junk. */ function coerceQuestion(input) {
    if (!input || typeof input !== 'object') return null;
    const q = input;
    const type = typeof q.type === 'string' ? q.type : '';
    if (!VALID_TYPES.has(type)) return null;
    const text = typeof q.text === 'string' ? q.text.trim() : '';
    if (!text) return null;
    const question = {
        id: typeof q.id === 'string' && q.id ? q.id : (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('q'),
        type: type,
        text,
        required: q.required === true
    };
    if (typeof q.helpText === 'string' && q.helpText.trim()) {
        question.helpText = q.helpText.trim();
    }
    if (Array.isArray(q.options)) {
        const options = q.options.map((o)=>{
            if (typeof o === 'string') return {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('opt'),
                label: o
            };
            if (o && typeof o === 'object') {
                const rec = o;
                const label = typeof rec.label === 'string' ? rec.label : '';
                if (!label) return null;
                return {
                    id: typeof rec.id === 'string' && rec.id ? rec.id : (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('opt'),
                    label,
                    ...typeof rec.value === 'string' ? {
                        value: rec.value
                    } : {}
                };
            }
            return null;
        }).filter((o)=>o !== null);
        if (options.length) question.options = options;
    }
    if (q.scale && typeof q.scale === 'object') {
        const s = q.scale;
        const min = typeof s.min === 'number' ? s.min : null;
        const max = typeof s.max === 'number' ? s.max : null;
        if (min !== null && max !== null && max > min) {
            question.scale = {
                min,
                max,
                ...typeof s.minLabel === 'string' ? {
                    minLabel: s.minLabel
                } : {},
                ...typeof s.maxLabel === 'string' ? {
                    maxLabel: s.maxLabel
                } : {}
            };
        }
    }
    return question;
}
function coerceSection(input) {
    if (!input || typeof input !== 'object') return null;
    const s = input;
    const title = typeof s.title === 'string' ? s.title.trim() : '';
    if (!title) return null;
    const questions = Array.isArray(s.questions) ? s.questions.map(coerceQuestion).filter((q)=>q !== null) : [];
    return {
        id: typeof s.id === 'string' && s.id ? s.id : (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('sec'),
        title,
        ...typeof s.description === 'string' && s.description ? {
            description: s.description
        } : {},
        questions
    };
}
const VALID_EMAIL_KINDS = new Set(__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_EMAIL_KINDS"]);
/**
 * Narrow unknown AI output to an email.
 *
 * `body` tolerates either a paragraph array or a single newline-separated
 * string, because a model asked for prose will sometimes return one blob
 * regardless of the schema.
 */ function coerceEmail(input) {
    if (!input || typeof input !== 'object') return null;
    const e = input;
    const kind = typeof e.kind === 'string' ? e.kind : '';
    if (!VALID_EMAIL_KINDS.has(kind)) return null;
    const subject = typeof e.subject === 'string' ? e.subject.trim() : '';
    if (!subject) return null;
    const body = (Array.isArray(e.body) ? e.body : typeof e.body === 'string' ? e.body.split(/\n{2,}|\n/) : []).map((p)=>typeof p === 'string' ? p.trim() : '').filter(Boolean);
    if (!body.length) return null;
    const text = (key)=>{
        const v = e[key];
        return typeof v === 'string' && v.trim() ? v.trim() : undefined;
    };
    const preheader = text('preheader');
    const greeting = text('greeting');
    const signOff = text('signOff');
    const senderName = text('senderName');
    return {
        id: typeof e.id === 'string' && e.id ? e.id : (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('em'),
        kind: kind,
        subject,
        body,
        ctaLabel: text('ctaLabel') ?? 'Start the survey',
        ...preheader ? {
            preheader
        } : {},
        ...greeting ? {
            greeting
        } : {},
        ...signOff ? {
            signOff
        } : {},
        ...senderName ? {
            senderName
        } : {}
    };
}
/** Immutably replace one section. */ function withSection(survey, sectionId, fn) {
    return {
        ...survey,
        sections: survey.sections.map((s)=>s.id === sectionId ? fn(s) : s)
    };
}
function applyOperations(survey, operations) {
    let next = survey;
    const outcomes = [];
    const ok = (operation, detail)=>outcomes.push({
            operation,
            applied: true,
            detail
        });
    const fail = (operation, detail)=>outcomes.push({
            operation,
            applied: false,
            detail
        });
    for (const op of operations){
        switch(op.operation){
            case 'add_question':
                {
                    const section = next.sections.find((s)=>s.id === op.sectionId) ?? next.sections[0];
                    if (!section) {
                        fail(op, 'No section available to add the question to.');
                        break;
                    }
                    const question = coerceQuestion(op.question);
                    if (!question) {
                        fail(op, 'Question was malformed and was not added.');
                        break;
                    }
                    const at = typeof op.index === 'number' ? Math.max(0, Math.min(op.index, section.questions.length)) : section.questions.length;
                    next = withSection(next, section.id, (s)=>({
                            ...s,
                            questions: [
                                ...s.questions.slice(0, at),
                                question,
                                ...s.questions.slice(at)
                            ]
                        }));
                    ok(op, `Added “${question.text}” to ${section.title}.`);
                    break;
                }
            case 'update_question':
                {
                    const found = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findQuestion"])(next, op.questionId);
                    if (!found) {
                        fail(op, `Question ${op.questionId} no longer exists.`);
                        break;
                    }
                    const merged = coerceQuestion({
                        ...found.question,
                        ...op.changes
                    });
                    if (!merged) {
                        fail(op, 'Update produced an invalid question and was skipped.');
                        break;
                    }
                    // Preserve identity — an update must never re-key the question.
                    merged.id = found.question.id;
                    const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(next, merged.id);
                    next = withSection(next, found.section.id, (s)=>({
                            ...s,
                            questions: s.questions.map((q)=>q.id === merged.id ? merged : q)
                        }));
                    ok(op, `Updated Q${n}.`);
                    break;
                }
            case 'delete_question':
                {
                    const found = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findQuestion"])(next, op.questionId);
                    if (!found) {
                        fail(op, `Question ${op.questionId} no longer exists.`);
                        break;
                    }
                    const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(next, op.questionId);
                    next = withSection(next, found.section.id, (s)=>({
                            ...s,
                            questions: s.questions.filter((q)=>q.id !== op.questionId)
                        }));
                    // Drop logic that referenced the removed question.
                    next = {
                        ...next,
                        logic: next.logic.filter((l)=>l.questionId !== op.questionId && l.targetId !== op.questionId)
                    };
                    ok(op, `Removed Q${n} (“${found.question.text}”).`);
                    break;
                }
            case 'move_question':
                {
                    const found = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findQuestion"])(next, op.questionId);
                    const target = next.sections.find((s)=>s.id === op.toSectionId);
                    if (!found || !target) {
                        fail(op, 'Move target was not found.');
                        break;
                    }
                    const question = found.question;
                    const without = withSection(next, found.section.id, (s)=>({
                            ...s,
                            questions: s.questions.filter((q)=>q.id !== question.id)
                        }));
                    const dest = without.sections.find((s)=>s.id === op.toSectionId);
                    const at = Math.max(0, Math.min(op.toIndex, dest ? dest.questions.length : 0));
                    next = withSection(without, op.toSectionId, (s)=>({
                            ...s,
                            questions: [
                                ...s.questions.slice(0, at),
                                question,
                                ...s.questions.slice(at)
                            ]
                        }));
                    ok(op, `Moved “${question.text}” to ${target.title}.`);
                    break;
                }
            case 'split_question':
                {
                    const found = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findQuestion"])(next, op.questionId);
                    if (!found) {
                        fail(op, `Question ${op.questionId} no longer exists.`);
                        break;
                    }
                    const replacements = (op.replacements ?? []).map(coerceQuestion).filter((q)=>q !== null);
                    if (replacements.length < 2) {
                        fail(op, 'A split needs at least two valid replacement questions.');
                        break;
                    }
                    const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(next, op.questionId);
                    next = withSection(next, found.section.id, (s)=>{
                        const at = s.questions.findIndex((q)=>q.id === op.questionId);
                        return {
                            ...s,
                            questions: [
                                ...s.questions.slice(0, at),
                                ...replacements,
                                ...s.questions.slice(at + 1)
                            ]
                        };
                    });
                    ok(op, `Split Q${n} into ${replacements.length} questions.`);
                    break;
                }
            case 'add_section':
                {
                    const section = coerceSection(op.section);
                    if (!section) {
                        fail(op, 'Section was malformed and was not added.');
                        break;
                    }
                    const at = typeof op.index === 'number' ? Math.max(0, Math.min(op.index, next.sections.length)) : next.sections.length;
                    next = {
                        ...next,
                        sections: [
                            ...next.sections.slice(0, at),
                            section,
                            ...next.sections.slice(at)
                        ]
                    };
                    ok(op, `Added section “${section.title}”.`);
                    break;
                }
            case 'update_survey':
                {
                    const changes = op.changes ?? {};
                    const patch = {};
                    if (typeof changes.title === 'string' && changes.title.trim()) {
                        patch.title = changes.title.trim();
                    }
                    if (typeof changes.description === 'string') {
                        patch.description = changes.description;
                    }
                    if (changes.meta && typeof changes.meta === 'object') {
                        patch.meta = {
                            ...next.meta,
                            ...changes.meta
                        };
                    }
                    if (!Object.keys(patch).length) {
                        fail(op, 'No valid survey fields to update.');
                        break;
                    }
                    next = {
                        ...next,
                        ...patch
                    };
                    ok(op, 'Updated survey details.');
                    break;
                }
            case 'add_logic':
                {
                    const raw = op.logic;
                    if (!raw || typeof raw !== 'object') {
                        fail(op, 'Logic rule was malformed.');
                        break;
                    }
                    const sourceId = raw.questionId ?? '';
                    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findQuestion"])(next, sourceId)) {
                        fail(op, 'Logic references a question that does not exist.');
                        break;
                    }
                    if (!raw.operator || !VALID_OPERATORS.has(raw.operator)) {
                        fail(op, `Unsupported logic operator “${raw.operator}”.`);
                        break;
                    }
                    if (!raw.action || !VALID_ACTIONS.has(raw.action)) {
                        fail(op, `Unsupported logic action “${raw.action}”.`);
                        break;
                    }
                    // Every action except end_survey needs a resolvable target.
                    if (raw.action !== 'end_survey') {
                        const targetId = raw.targetId ?? '';
                        const isQuestion = Boolean((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findQuestion"])(next, targetId));
                        const isSection = next.sections.some((s)=>s.id === targetId);
                        if (!isQuestion && !isSection) {
                            fail(op, 'Logic references a target that does not exist.');
                            break;
                        }
                    }
                    const rule = {
                        id: raw.id ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["makeId"])('lg'),
                        questionId: sourceId,
                        operator: raw.operator,
                        action: raw.action,
                        ...raw.value !== undefined ? {
                            value: raw.value
                        } : {},
                        ...raw.targetId ? {
                            targetId: raw.targetId
                        } : {}
                    };
                    next = {
                        ...next,
                        logic: [
                            ...next.logic,
                            rule
                        ]
                    };
                    const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["questionNumber"])(next, sourceId);
                    ok(op, `Added logic on Q${n}.`);
                    break;
                }
            case 'set_email':
                {
                    const email = coerceEmail(op.email);
                    if (!email) {
                        fail(op, 'Email was malformed and was not saved.');
                        break;
                    }
                    // One email per kind: replace in place when it exists, keeping the
                    // existing id so an edit does not re-key the email under the editor.
                    const existing = next.emails.find((e)=>e.kind === email.kind);
                    const saved = existing ? {
                        ...email,
                        id: existing.id
                    } : email;
                    next = {
                        ...next,
                        emails: existing ? next.emails.map((e)=>e.kind === saved.kind ? saved : e) : [
                            ...next.emails,
                            saved
                        ]
                    };
                    // Keep send order stable regardless of the order they arrived in.
                    next = {
                        ...next,
                        emails: [
                            ...next.emails
                        ].sort((a, b)=>__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_EMAIL_KINDS"].indexOf(a.kind) - __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_EMAIL_KINDS"].indexOf(b.kind))
                    };
                    ok(op, `${existing ? 'Updated' : 'Wrote'} the ${__TURBOPACK__imported__module__$5b$project$5d2f$types$2f$survey$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SURVEY_EMAIL_LABELS"][saved.kind]} email.`);
                    break;
                }
            default:
                {
                    // Unknown operation kind from an AI response — ignore rather than throw.
                    fail(op, 'Unrecognised operation was ignored.');
                    break;
                }
        }
    }
    return {
        survey: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$survey$2f$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["touch"])(next),
        outcomes
    };
}
function appliedChanges(outcomes) {
    return outcomes.filter((o)=>o.applied).map((o)=>o.detail);
}
}),
"[project]/types/survey.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — core survey domain types.
 *
 * These are the shapes the survey builder and both AI providers agree on.
 * Nothing here is persisted: for the hackathon MVP a Survey lives in React
 * state only (see lib/survey/store.ts).
 */ /** Question types supported by the builder. */ __turbopack_context__.s([
    "CHOICE_TYPES",
    ()=>CHOICE_TYPES,
    "QUESTION_TYPE_LABELS",
    ()=>QUESTION_TYPE_LABELS,
    "SCALE_TYPES",
    ()=>SCALE_TYPES,
    "SURVEY_EMAIL_KINDS",
    ()=>SURVEY_EMAIL_KINDS,
    "SURVEY_EMAIL_LABELS",
    ()=>SURVEY_EMAIL_LABELS
]);
const CHOICE_TYPES = [
    'single_select',
    'multi_select',
    'dropdown'
];
const SCALE_TYPES = [
    'rating',
    'nps'
];
const QUESTION_TYPE_LABELS = {
    short_text: 'Text',
    long_text: 'Long Text',
    single_select: 'Single Choice',
    multi_select: 'Multiple Choice',
    dropdown: 'Dropdown',
    rating: 'Rating',
    nps: 'NPS',
    boolean: 'Yes / No',
    date: 'Date'
};
const SURVEY_EMAIL_KINDS = [
    'invitation',
    'reminder'
];
const SURVEY_EMAIL_LABELS = {
    invitation: 'Invitation',
    reminder: 'Reminder'
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0i2pe7b._.js.map