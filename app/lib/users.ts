import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type StoredUser = {
  id: string;
  email: string;
  password: {
    algo: "pbkdf2-sha256";
    salt: string; // base64
    iterations: number;
    hash: string; // base64
  };
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ version: 1, users: [] }, null, 2), "utf8");
  }
}

async function readAll(): Promise<StoredUser[]> {
  await ensureStore();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  const parsed = JSON.parse(raw) as any;
  if (!parsed || !Array.isArray(parsed.users)) return [];
  return parsed.users as StoredUser[];
}

async function writeAll(users: StoredUser[]) {
  await ensureStore();
  await fs.writeFile(USERS_FILE, JSON.stringify({ version: 1, users }, null, 2), "utf8");
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const iterations = 120_000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
  return {
    algo: "pbkdf2-sha256" as const,
    salt: salt.toString("base64"),
    iterations,
    hash: hash.toString("base64"),
  };
}

function verifyPassword(password: string, stored: StoredUser["password"]) {
  if (stored.algo !== "pbkdf2-sha256") return false;
  const salt = Buffer.from(stored.salt, "base64");
  const hash = crypto.pbkdf2Sync(password, salt, stored.iterations, 32, "sha256");
  return crypto.timingSafeEqual(hash, Buffer.from(stored.hash, "base64"));
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const e = email.trim().toLowerCase();
  const users = await readAll();
  return users.find((u) => u.email === e) ?? null;
}

export async function addUser(email: string, password: string): Promise<StoredUser> {
  const e = email.trim().toLowerCase();
  const users = await readAll();

  if (users.some((u) => u.email === e)) {
    throw new Error("EMAIL_TAKEN");
  }

  const now = new Date().toISOString();
  const user: StoredUser = {
    id: uid(),
    email: e,
    password: hashPassword(password),
    createdAt: now,
    updatedAt: now,
  };

  users.unshift(user);
  await writeAll(users);
  return user;
}

export async function authenticate(email: string, password: string): Promise<StoredUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  return verifyPassword(password, user.password) ? user : null;
}

export async function changePassword(email: string, oldPassword: string, newPassword: string): Promise<void> {
  const e = email.trim().toLowerCase();
  const users = await readAll();
  const idx = users.findIndex((u) => u.email === e);
  if (idx === -1) throw new Error("NOT_FOUND");

  const ok = verifyPassword(oldPassword, users[idx].password);
  if (!ok) throw new Error("BAD_OLD_PASSWORD");

  users[idx] = {
    ...users[idx],
    password: hashPassword(newPassword),
    updatedAt: new Date().toISOString(),
  };
  await writeAll(users);
}
