(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__6743fe0c._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/app/lib/session.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$session$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/session.ts [middleware-edge] (ecmascript)");
;
;
async function middleware(request) {
    const { pathname } = request.nextUrl;
    // Chronimy podstrony wymagające konta.
    const protectedRoute = pathname.startsWith("/subskrypcja") || pathname.startsWith("/chat") || pathname.startsWith("/profile") || pathname.startsWith("/dashboard"); // zachowana kompatybilność (redirect)
    if (!protectedRoute) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    const token = request.cookies.get("submanager_session")?.value;
    const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";
    const username = token ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$session$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["verifySessionToken"])(token, secret) : null;
    if (!username) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    matcher: [
        "/subskrypcja/:path*",
        "/chat/:path*",
        "/profile/:path*",
        "/dashboard/:path*"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__6743fe0c._.js.map