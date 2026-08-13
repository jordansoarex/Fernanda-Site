const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_COOKIE = "__Host-fs_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_LOGIN_BODY = 16 * 1024;

export function htmlEscape(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export function timingSafeTextEqual(a = "", b = "") {
  const left = encoder.encode(String(a));
  const right = encoder.encode(String(b));
  if (left.byteLength !== right.byteLength) {
    crypto.subtle.timingSafeEqual(left, left);
    return false;
  }
  return crypto.subtle.timingSafeEqual(left, right);
}

function parseCookies(header = "") {
  const result = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    result[key] = value;
  }
  return result;
}

export async function createSession(user, secret) {
  const payload = {
    u: user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    csrf: crypto.randomUUID(),
    nonce: crypto.randomUUID()
  };
  const encoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = base64UrlEncode(await hmac(secret, encoded));
  return { token: `${encoded}.${signature}`, payload };
}

export async function verifySession(request, secret) {
  if (!secret) return null;
  const token = parseCookies(request.headers.get("Cookie") || "")[SESSION_COOKIE];
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let expected;
  let actual;
  try {
    expected = await hmac(secret, encoded);
    actual = base64UrlDecode(signature);
  } catch {
    return null;
  }
  if (expected.byteLength !== actual.byteLength || !crypto.subtle.timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(decoder.decode(base64UrlDecode(encoded)));
    if (!payload?.u || !payload?.exp || !payload?.csrf) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export function requestHasValidOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readSmallForm(request, maxBytes = MAX_LOGIN_BODY) {
  const length = Number(request.headers.get("Content-Length") || "0");
  if (length && length > maxBytes) throw new Error("body_too_large");
  const text = await request.text();
  if (encoder.encode(text).byteLength > maxBytes) throw new Error("body_too_large");
  return new URLSearchParams(text);
}

export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

export async function canAttemptLogin(store, ip) {
  if (!store) return false;
  const key = `auth:fail:${ip}`;
  const count = Number(await store.get(key) || "0");
  return count < 5;
}

export async function registerFailedLogin(store, ip) {
  const key = `auth:fail:${ip}`;
  const count = Number(await store.get(key) || "0") + 1;
  await store.put(key, String(count), { expirationTtl: 600 });
}

export async function clearFailedLogin(store, ip) {
  await store.delete(`auth:fail:${ip}`);
}

export function secureHeaders(contentType = "text/html; charset=utf-8") {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet"
  };
}

export function redirect(location, extraHeaders = {}) {
  return new Response(null, { status: 303, headers: { Location: location, ...extraHeaders, "Cache-Control": "no-store" } });
}

export function requireCsrf(form, session) {
  return timingSafeTextEqual(form.get("csrf") || "", session?.csrf || "");
}
