import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

type User = {
  id: string;
  username: string;
  passwordHash: string; // "scrypt$<saltB64>$<hashB64>"
  createdAt: string;
  updatedAt: string;
};

type Store = { version: 1; users: User[] };

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_PATH);
  } catch {
    const init: Store = { version: 1, users: [] };
    await fs.writeFile(USERS_PATH, JSON.stringify(init, null, 2), "utf8");
  }
}

async function readStore(): Promise<Store> {
  await ensureStore();
  try {
    const text = await fs.readFile(USERS_PATH, "utf8");
    const raw = JSON.parse(text) as Store;
    if (!raw || raw.version !== 1 || !Array.isArray(raw.users)) return { version: 1, users: [] };
    return raw;
  } catch {
    return { version: 1, users: [] };
  }
}

async function writeStore(store: Store): Promise<void> {
  await ensureStore();
  await fs.writeFile(USERS_PATH, JSON.stringify(store, null, 2), "utf8");
}

function uid(): string {
  return randomBytes(16).toString("hex");
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "base64");
  const hash = Buffer.from(parts[2], "base64");
  const calc = scryptSync(password, salt, 64);
  return hash.length === calc.length && timingSafeEqual(hash, calc);
}

export function normalizeUsername(input: string): string | null {
  const u = input.trim();
  // prosty i bezpieczny login (żeby nie psuł kluczy localStorage)
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(u)) return null;
  return u;
}

export async function createUser(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const nu = normalizeUsername(username);
  if (!nu) return { ok: false, error: "Login musi mieć 3-32 znaki: litery/cyfry/._-" };
  if (password.length < 6) return { ok: false, error: "Hasło musi mieć minimum 6 znaków." };

  const store = await readStore();
  const exists = store.users.some((x) => x.username.toLowerCase() === nu.toLowerCase());
  if (exists) return { ok: false, error: "Użytkownik o takim loginie już istnieje." };

  const now = new Date().toISOString();
  store.users.push({
    id: uid(),
    username: nu,
    passwordHash: hashPassword(password),
    createdAt: now,
    updatedAt: now,
  });
  await writeStore(store);
  return { ok: true };
}

export async function verifyUser(username: string, password: string): Promise<boolean> {
  const store = await readStore();
  const user = store.users.find((x) => x.username.toLowerCase() === username.toLowerCase());
  if (!user) return false;
  return verifyPassword(password, user.passwordHash);
}

export async function changePassword(username: string, oldPassword: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newPassword.length < 6) return { ok: false, error: "Nowe hasło musi mieć minimum 6 znaków." };

  const store = await readStore();
  const idx = store.users.findIndex((x) => x.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return { ok: false, error: "Nie znaleziono użytkownika." };

  const user = store.users[idx];
  if (!verifyPassword(oldPassword, user.passwordHash)) return { ok: false, error: "Stare hasło jest nieprawidłowe." };

  const now = new Date().toISOString();
  store.users[idx] = { ...user, passwordHash: hashPassword(newPassword), updatedAt: now };
  await writeStore(store);
  return { ok: true };
}
