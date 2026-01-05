module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/lib/session.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSessionToken",
    ()=>createSessionToken,
    "verifySessionToken",
    ()=>verifySessionToken
]);
function b64urlEncode(bytes) {
    let str = "";
    for (const b of bytes)str += String.fromCharCode(b);
    const b64 = btoa(str);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(s) {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++)out[i] = bin.charCodeAt(i);
    return out;
}
function timingSafeEqualStr(a, b) {
    const aa = new TextEncoder().encode(a);
    const bb = new TextEncoder().encode(b);
    if (aa.length !== bb.length) return false;
    let diff = 0;
    for(let i = 0; i < aa.length; i++)diff |= aa[i] ^ bb[i];
    return diff === 0;
}
async function hmacSha256(data, secret) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), {
        name: "HMAC",
        hash: "SHA-256"
    }, false, [
        "sign"
    ]);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
    return new Uint8Array(sig);
}
async function createSessionToken(username, secret, ttlSeconds = 60 * 60 * 24 * 7) {
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const payload = JSON.stringify({
        u: username,
        exp
    });
    const payloadPart = b64urlEncode(new TextEncoder().encode(payload));
    const sig = await hmacSha256(payloadPart, secret);
    const sigPart = b64urlEncode(sig);
    return `${payloadPart}.${sigPart}`;
}
async function verifySessionToken(token, secret) {
    const [payloadPart, sigPart] = token.split(".");
    if (!payloadPart || !sigPart) return null;
    const expected = b64urlEncode(await hmacSha256(payloadPart, secret));
    if (!timingSafeEqualStr(expected, sigPart)) return null;
    try {
        const payloadJson = new TextDecoder().decode(b64urlDecode(payloadPart));
        const payload = JSON.parse(payloadJson);
        if (!payload?.u || !payload?.exp) return null;
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload.u;
    } catch  {
        return null;
    }
}
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[project]/app/lib/billingStore.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearBilling",
    ()=>clearBilling,
    "getBilling",
    ()=>getBilling,
    "setBilling",
    ()=>setBilling
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
;
;
const DATA_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "data");
const PATH = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(DATA_DIR, "billing.json");
async function ensure() {
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].mkdir(DATA_DIR, {
        recursive: true
    });
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].access(PATH);
    } catch  {
        const init = {
            version: 1,
            users: {}
        };
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].writeFile(PATH, JSON.stringify(init, null, 2), "utf8");
    }
}
async function readStore() {
    await ensure();
    try {
        const txt = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readFile(PATH, "utf8");
        const raw = JSON.parse(txt);
        if (!raw || raw.version !== 1 || typeof raw.users !== "object") return {
            version: 1,
            users: {}
        };
        return raw;
    } catch  {
        return {
            version: 1,
            users: {}
        };
    }
}
async function writeStore(store) {
    await ensure();
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].writeFile(PATH, JSON.stringify(store, null, 2), "utf8");
}
async function getBilling(username) {
    const store = await readStore();
    return store.users[username] ?? {
        plan: "none",
        active: false
    };
}
async function setBilling(username, plan, active = true) {
    const store = await readStore();
    const now = new Date().toISOString();
    const prev = store.users[username];
    const record = {
        plan,
        active,
        since: active ? prev?.since ?? now : undefined,
        updatedAt: now
    };
    store.users[username] = record;
    await writeStore(store);
    return record;
}
async function clearBilling(username) {
    return setBilling(username, "none", false);
}
}),
"[project]/app/api/billing/activate/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/session.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$billingStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/billingStore.ts [app-route] (ecmascript)");
;
;
;
const runtime = "nodejs";
async function getUsername(req) {
    const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";
    const cookie = req.headers.get("cookie") ?? "";
    const m = cookie.match(/submanager_session=([^;]+)/);
    const token = m?.[1] ? decodeURIComponent(m[1]) : null;
    return token ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifySessionToken"])(token, secret) : null;
}
async function POST(req) {
    const username = await getUsername(req);
    if (!username) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: false,
        error: "Brak sesji."
    }, {
        status: 401
    });
    const body = await req.json().catch(()=>({}));
    const plan = String(body?.plan ?? "");
    if (!plan || ![
        "basic",
        "pro",
        "elite"
    ].includes(plan)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: "Nieprawidłowy plan."
        }, {
            status: 400
        });
    }
    // Tryb DEV: aktywacja bez bramki płatności.
    // Produkcja: to powinno być wykonywane przez webhook po udanej płatności (Stripe/PayU/...)
    const billing = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$billingStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setBilling"])(username, plan, true);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true,
        billing
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ed4e1433._.js.map