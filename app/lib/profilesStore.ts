export type Profile = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const LS_PROFILES = "submanager_profiles_v1";
const LS_ACTIVE = "submanager_active_profile_v1";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function nowISO() {
  return new Date().toISOString();
}

function safeParse<T>(text: string | null): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function ensureProfiles(): Profile[] {
  if (typeof window === "undefined") return [];

  const raw = safeParse<Profile[]>(window.localStorage.getItem(LS_PROFILES));
  if (Array.isArray(raw) && raw.length) return raw;

  const t = nowISO();
  const defaults: Profile[] = [
    { id: "default", name: "Ja", createdAt: t, updatedAt: t },
  ];
  window.localStorage.setItem(LS_PROFILES, JSON.stringify(defaults));
  window.localStorage.setItem(LS_ACTIVE, "default");
  return defaults;
}

export function loadProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  return ensureProfiles();
}

export function saveProfiles(items: Profile[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_PROFILES, JSON.stringify(items));
}

export function getActiveProfileId(): string {
  if (typeof window === "undefined") return "default";
  ensureProfiles();
  return window.localStorage.getItem(LS_ACTIVE) || "default";
}

export function setActiveProfileId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_ACTIVE, id);
}

export function addProfile(name: string): Profile {
  const t = nowISO();
  return { id: uid(), name: name.trim() || "Nowy profil", createdAt: t, updatedAt: t };
}

export function renameProfile(p: Profile, name: string): Profile {
  return { ...p, name: name.trim() || p.name, updatedAt: nowISO() };
}
