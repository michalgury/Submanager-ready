"use client";

import { useEffect, useMemo, useState } from "react";
import { IconMoon, IconSun } from "./icons";

type Theme = "light" | "dark" | "system";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem("ui_theme");
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  const nextTheme = useMemo<Theme>(() => {
    if (theme === "light") return "dark";
    if (theme === "dark") return "system";
    return "light";
  }, [theme]);

  function onToggle() {
    const t = nextTheme;
    setTheme(t);
    try {
      window.localStorage.setItem("ui_theme", t);
    } catch {}
    applyTheme(t);
  }

  const label = theme === "system" ? "System" : theme === "light" ? "Jasny" : "Ciemny";
  const Icon = theme === "dark" ? IconMoon : IconSun;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
      title={`Motyw: ${label} (kliknij aby zmienić)`}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
