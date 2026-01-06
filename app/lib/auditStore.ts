export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "undo_delete"
  | "archive"
  | "restore"
  | "import_merge"
  | "import_replace"
  | "import_csv"
  | "export_json"
  | "export_csv"
  | "budget_update";

export type AuditEvent = {
  id: string;
  at: string; // ISO
  action: AuditAction;
  message: string;
  meta?: Record<string, unknown>;
};

type StoredAudit = {
  version: 1;
  updatedAt: string;
  events: AuditEvent[];
};

const LIMIT = 250;

function key(scope: string) {
  return `submanager_${scope}_audit_v1`;
}

export function loadAudit(scope = "global"): AuditEvent[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key(scope));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredAudit;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.events)) return [];
    return parsed.events.filter((e) => e && typeof e.id === "string" && typeof e.at === "string");
  } catch {
    return [];
  }
}

export function saveAudit(events: AuditEvent[], scope = "global"): void {
  if (typeof window === "undefined") return;
  const payload: StoredAudit = {
    version: 1,
    updatedAt: new Date().toISOString(),
    events: events.slice(0, LIMIT),
  };
  window.localStorage.setItem(key(scope), JSON.stringify(payload));
}

export function clearAudit(scope = "global"): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(scope));
}
