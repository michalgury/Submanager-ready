const OWNER_KEY = "submanager_owner";

function normalizeOwner(owner: string) {
  return (owner || "guest").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

export function setStorageOwner(owner: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OWNER_KEY, normalizeOwner(owner));
}

export function getStorageOwner() {
  if (typeof window === "undefined") return "guest";
  return localStorage.getItem(OWNER_KEY) || "guest";
}

/**
 * Usuwa wszystkie dane localStorage należące do danego ownera
 * (np. guest). NIE rusza innych użytkowników.
 */
export function clearOwnerStorage(owner: string) {
  if (typeof window === "undefined") return;

  const o = normalizeOwner(owner);
  const prefix = `submanager:${o}:`;

  // lecimy od końca, bo usuwamy klucze w trakcie iteracji
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(prefix)) localStorage.removeItem(k);
  }
}
