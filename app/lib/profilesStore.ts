import { getStorageOwner } from "./storageOwner";

export type Profile = { id: string; name: string; createdAt: string };

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function ownerKey(...parts: string[]) {
  const o = getStorageOwner().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return ["submanager", o, ...parts].join(":");
}

const PROFILES_KEY = () => ownerKey("profiles:v1");
const ACTIVE_KEY = () => ownerKey("activeProfile:v1");

function ensureDefault(ps: Profile[]) {
  if (ps.length) return ps;
  return [{ id: "default", name: "Ja", createdAt: new Date().toISOString() }];
}

export function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY());
    const parsed = raw ? (JSON.parse(raw) as Profile[]) : [];
    return ensureDefault(Array.isArray(parsed) ? parsed : []);
  } catch {
    return ensureDefault([]);
  }
}

export function saveProfiles(ps: Profile[]) {
  localStorage.setItem(PROFILES_KEY(), JSON.stringify(ps));
}

export function getActiveProfileId(): string {
  const raw = localStorage.getItem(ACTIVE_KEY());
  return raw || "default";
}

export function setActiveProfileId(id: string) {
  localStorage.setItem(ACTIVE_KEY(), id);
}

export function addProfile(name: string): Profile {
  return {
    id: uid(),
    name: String(name || "Profil").trim() || "Profil",
    createdAt: new Date().toISOString(),
  };
}

export function renameProfile(p: Profile, name: string): Profile {
  return { ...p, name: String(name || p.name).trim() || p.name };
}
