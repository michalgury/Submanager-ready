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
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/app/lib/usersStore.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "changePassword",
    ()=>changePassword,
    "createUser",
    ()=>createUser,
    "normalizeUsername",
    ()=>normalizeUsername,
    "verifyUser",
    ()=>verifyUser
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
;
;
const DATA_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "data");
const USERS_PATH = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(DATA_DIR, "users.json");
async function ensureStore() {
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].mkdir(DATA_DIR, {
        recursive: true
    });
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].access(USERS_PATH);
    } catch  {
        const init = {
            version: 1,
            users: []
        };
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].writeFile(USERS_PATH, JSON.stringify(init, null, 2), "utf8");
    }
}
async function readStore() {
    await ensureStore();
    try {
        const text = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readFile(USERS_PATH, "utf8");
        const raw = JSON.parse(text);
        if (!raw || raw.version !== 1 || !Array.isArray(raw.users)) return {
            version: 1,
            users: []
        };
        return raw;
    } catch  {
        return {
            version: 1,
            users: []
        };
    }
}
async function writeStore(store) {
    await ensureStore();
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].writeFile(USERS_PATH, JSON.stringify(store, null, 2), "utf8");
}
function uid() {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(16).toString("hex");
}
function hashPassword(password) {
    const salt = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(16);
    const hash = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["scryptSync"])(password, salt, 64);
    return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}
function verifyPassword(password, stored) {
    const parts = stored.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[1], "base64");
    const hash = Buffer.from(parts[2], "base64");
    const calc = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["scryptSync"])(password, salt, 64);
    return hash.length === calc.length && (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["timingSafeEqual"])(hash, calc);
}
function normalizeUsername(input) {
    const u = input.trim();
    // prosty i bezpieczny login (żeby nie psuł kluczy localStorage)
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(u)) return null;
    return u;
}
async function createUser(username, password) {
    const nu = normalizeUsername(username);
    if (!nu) return {
        ok: false,
        error: "Login musi mieć 3-32 znaki: litery/cyfry/._-"
    };
    if (password.length < 6) return {
        ok: false,
        error: "Hasło musi mieć minimum 6 znaków."
    };
    const store = await readStore();
    const exists = store.users.some((x)=>x.username.toLowerCase() === nu.toLowerCase());
    if (exists) return {
        ok: false,
        error: "Użytkownik o takim loginie już istnieje."
    };
    const now = new Date().toISOString();
    store.users.push({
        id: uid(),
        username: nu,
        passwordHash: hashPassword(password),
        createdAt: now,
        updatedAt: now
    });
    await writeStore(store);
    return {
        ok: true
    };
}
async function verifyUser(username, password) {
    const store = await readStore();
    const user = store.users.find((x)=>x.username.toLowerCase() === username.toLowerCase());
    if (!user) return false;
    return verifyPassword(password, user.passwordHash);
}
async function changePassword(username, oldPassword, newPassword) {
    if (newPassword.length < 6) return {
        ok: false,
        error: "Nowe hasło musi mieć minimum 6 znaków."
    };
    const store = await readStore();
    const idx = store.users.findIndex((x)=>x.username.toLowerCase() === username.toLowerCase());
    if (idx === -1) return {
        ok: false,
        error: "Nie znaleziono użytkownika."
    };
    const user = store.users[idx];
    if (!verifyPassword(oldPassword, user.passwordHash)) return {
        ok: false,
        error: "Stare hasło jest nieprawidłowe."
    };
    const now = new Date().toISOString();
    store.users[idx] = {
        ...user,
        passwordHash: hashPassword(newPassword),
        updatedAt: now
    };
    await writeStore(store);
    return {
        ok: true
    };
}
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
"[project]/app/api/register/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$usersStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/usersStore.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/session.ts [app-route] (ecmascript)");
;
;
;
const runtime = "nodejs";
async function POST(req) {
    const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";
    try {
        const body = await req.json();
        const username = String(body.username ?? "");
        const password = String(body.password ?? "");
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$usersStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createUser"])(username, password);
        if (!res.ok) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: res.error
        }, {
            status: 400
        });
        // po rejestracji logujemy od razu
        const token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$session$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createSessionToken"])(username, secret);
        const out = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true
        });
        out.cookies.set("submanager_session", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: ("TURBOPACK compile-time value", "development") === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7
        });
        return out;
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: "Błąd rejestracji."
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1d8058a8._.js.map