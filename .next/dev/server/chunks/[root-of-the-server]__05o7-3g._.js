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
"[project]/app/api/surveys/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
/**
 * GET  /api/surveys — list saved surveys (summaries only).
 * POST /api/surveys — create or replace a survey.
 *
 * REST rather than the RPC-style /api/ai/[operation] catch-all, because these
 * are ordinary resource operations. Envelope conventions match that route:
 * `{ ok: true, data }` on success, `{ ok: false, error }` on failure.
 *
 * When storage is not configured, POST answers 200 with `persisted: false`
 * rather than an error. Running without a database is a supported mode, and
 * an autosave firing every couple of seconds must not paint an error banner
 * on a machine that was never meant to have one.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$surveys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/db/surveys.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/supabase.ts [app-route] (ecmascript)");
;
;
const dynamic = 'force-dynamic';
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
function upstream(message) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: false,
        error: {
            code: 'upstream_error',
            message
        }
    }, {
        status: 502
    });
}
async function GET() {
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$surveys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["listSurveys"])();
    if (!result.ok) return upstream(result.error.message);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true,
        data: {
            surveys: result.data,
            configured: result.configured
        }
    });
}
async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch  {
        return bad('Request body must be JSON.');
    }
    const survey = body.survey;
    if (!survey?.id || typeof survey.id !== 'string') {
        return bad('A survey with an id is required.');
    }
    if (!Array.isArray(survey.sections)) {
        return bad('That does not look like a survey.');
    }
    // Not configured is a success with persisted:false, so the client can latch
    // off quietly instead of retrying and erroring every debounce interval.
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isDbConfigured"])()) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            data: {
                id: survey.id,
                updatedAt: survey.updatedAt,
                persisted: false
            }
        });
    }
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$surveys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["upsertSurvey"])(survey);
    if (!result.ok) return upstream(result.error.message);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true,
        data: {
            ...result.data,
            persisted: true
        }
    });
}
}),
"[project]/lib/db/mapping.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Survey Copilot — row mapping.
 *
 * Pure projections between a Survey and its database row. Deliberately NOT
 * marked `server-only`, unlike the rest of lib/db: these functions touch no
 * credentials and no client, so keeping them importable lets the smoke suite
 * assert the mapping without a database or a browser.
 */ __turbopack_context__.s([
    "rowToSummary",
    ()=>rowToSummary,
    "surveyToRow",
    ()=>surveyToRow
]);
function surveyToRow(survey) {
    return {
        id: survey.id,
        title: survey.title?.trim() || 'Untitled Survey',
        status: survey.status,
        data: survey,
        created_at: survey.createdAt,
        updated_at: survey.updatedAt
    };
}
function rowToSummary(row) {
    return {
        id: row.id,
        title: row.title?.trim() || 'Untitled Survey',
        status: row.status ?? 'draft',
        updatedAt: row.updated_at
    };
}
}),
"[project]/lib/db/supabase.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDb",
    ()=>getDb,
    "getDbStatus",
    ()=>getDbStatus,
    "isDbConfigured",
    ()=>isDbConfigured
]);
/**
 * Survey Copilot — Supabase client.
 *
 * SERVER-ONLY. The `server-only` import above makes an accidental import from
 * a client component a *build* error rather than a runtime key leak:
 * SUPABASE_SERVICE_ROLE_KEY bypasses row-level security, so it must never
 * reach the browser.
 *
 *   Browser -> Next.js route handler -> this module -> Postgres
 *
 * Storage is optional. With no env vars the app runs entirely in memory —
 * surveys live in React state for the session, exactly as they did before
 * persistence existed. Mirrors how lib/ai/provider.ts treats a missing
 * ANTHROPIC_API_KEY.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
;
/** Memoised so repeated route invocations reuse one client. */ let client = null;
function url() {
    return process.env.SUPABASE_URL?.trim() ?? '';
}
function serviceKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
}
function isDbConfigured() {
    return Boolean(url() && serviceKey());
}
function getDb() {
    if (!isDbConfigured()) return null;
    if (!client) {
        client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url(), serviceKey(), {
            // No user sessions: this client is only ever the service role acting on
            // behalf of the server, so session persistence and refresh are noise.
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
    }
    return client;
}
function getDbStatus() {
    return {
        configured: isDbConfigured()
    };
}
}),
"[project]/lib/db/surveys.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteSurvey",
    ()=>deleteSurvey,
    "getSurvey",
    ()=>getSurvey,
    "listSurveys",
    ()=>listSurveys,
    "upsertSurvey",
    ()=>upsertSurvey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$mapping$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/mapping.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/supabase.ts [app-route] (ecmascript)");
;
;
;
const TABLE = 'surveys';
/** How many surveys the dashboard list returns. */ const LIST_LIMIT = 50;
function notConfigured(empty) {
    return {
        ok: true,
        data: empty,
        configured: false
    };
}
function failed(message) {
    return {
        ok: false,
        error: {
            message
        }
    };
}
async function listSurveys() {
    const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDb"])();
    if (!db) return notConfigured([]);
    const { data, error } = await db.from(TABLE).select('id,title,status,updated_at').order('updated_at', {
        ascending: false
    }).limit(LIST_LIMIT);
    if (error) return failed(error.message);
    return {
        ok: true,
        data: (data ?? []).map(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$mapping$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rowToSummary"]),
        configured: true
    };
}
async function getSurvey(id) {
    const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDb"])();
    if (!db) return notConfigured(null);
    const { data, error } = await db.from(TABLE).select('data').eq('id', id).maybeSingle();
    if (error) return failed(error.message);
    return {
        ok: true,
        data: data?.data ?? null,
        configured: true
    };
}
async function upsertSurvey(survey) {
    const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDb"])();
    const payload = {
        id: survey.id,
        updatedAt: survey.updatedAt
    };
    if (!db) return notConfigured(payload);
    const { error } = await db.from(TABLE).upsert((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$mapping$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["surveyToRow"])(survey), {
        onConflict: 'id'
    });
    if (error) return failed(error.message);
    return {
        ok: true,
        data: payload,
        configured: true
    };
}
async function deleteSurvey(id) {
    const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDb"])();
    if (!db) return notConfigured({
        id
    });
    const { error } = await db.from(TABLE).delete().eq('id', id);
    if (error) return failed(error.message);
    return {
        ok: true,
        data: {
            id
        },
        configured: true
    };
}
;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__05o7-3g._.js.map