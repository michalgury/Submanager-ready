import { promises as fs } from "node:fs";
import path from "node:path";

export type Plan = "none" | "basic" | "pro" | "elite";

export type BillingRecord = {
  plan: Plan;
  active: boolean;
  since?: string; // ISO
  updatedAt?: string; // ISO
};

type Store = { version: 1; users: Record<string, BillingRecord> };

const DATA_DIR = path.join(process.cwd(), "data");
const PATH = path.join(DATA_DIR, "billing.json");

async function ensure(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PATH);
  } catch {
    const init: Store = { version: 1, users: {} };
    await fs.writeFile(PATH, JSON.stringify(init, null, 2), "utf8");
  }
}

async function readStore(): Promise<Store> {
  await ensure();
  try {
    const txt = await fs.readFile(PATH, "utf8");
    const raw = JSON.parse(txt) as Store;
    if (!raw || raw.version !== 1 || typeof raw.users !== "object") return { version: 1, users: {} };
    return raw;
  } catch {
    return { version: 1, users: {} };
  }
}

async function writeStore(store: Store): Promise<void> {
  await ensure();
  await fs.writeFile(PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getBilling(username: string): Promise<BillingRecord> {
  const store = await readStore();
  return store.users[username] ?? { plan: "none", active: false };
}

export async function setBilling(username: string, plan: Plan, active = true): Promise<BillingRecord> {
  const store = await readStore();
  const now = new Date().toISOString();
  const prev = store.users[username];

  const record: BillingRecord = {
    plan,
    active,
    since: active ? (prev?.since ?? now) : undefined,
    updatedAt: now,
  };

  store.users[username] = record;
  await writeStore(store);
  return record;
}

export async function clearBilling(username: string): Promise<BillingRecord> {
  return setBilling(username, "none", false);
}
