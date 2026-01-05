"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import {
  IconChat,
  IconHome,
  IconSearch,
  IconSubscription,
  IconUser,
  IconLock,
} from "./icons";

type NavItem = {
  label: string;
  href: string;
  icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element;
  requiresAuth?: boolean;
};

export default function Sidebar(props: { authenticated: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");

  const itemsCreate: NavItem[] = useMemo(
    () => [
      { label: "Start", href: "/", icon: IconHome, requiresAuth: false },
      { label: "Chat", href: "/chat", icon: IconChat, requiresAuth: true },
    ],
    []
  );

  const itemsApps: NavItem[] = useMemo(
    () => [
      { label: "Subskrypcja", href: "/subskrypcja", icon: IconSubscription, requiresAuth: true },
      { label: "Profil", href: "/profile", icon: IconUser, requiresAuth: true },
    ],
    []
  );

  const all = useMemo(() => [...itemsCreate, ...itemsApps], [itemsCreate, itemsApps]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((x) => x.label.toLowerCase().includes(needle));
  }, [q, all]);

  function go(item: NavItem) {
    if (item.requiresAuth && !props.authenticated) {
      router.push("/?auth=login");
      return;
    }
    router.push(item.href);
  }

  function Row({ item }: { item: NavItem }) {
    const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
    const locked = item.requiresAuth && !props.authenticated;

    return (
      <button
        type="button"
        onClick={() => go(item)}
        className={
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold " +
          (active
            ? "bg-white/10 text-white"
            : "text-white/80 hover:bg-white/5 hover:text-white") +
          (locked ? " opacity-70" : "")
        }
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 group-hover:bg-white/10">
          <item.icon className="h-5 w-5" />
        </span>
        <span className="flex-1 truncate">{item.label}</span>
        {locked ? <IconLock className="h-4 w-4 text-white/50" /> : null}
      </button>
    );
  }

  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-white/10 bg-gradient-to-b from-zinc-950 to-zinc-900 p-4 text-white">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
          <span className="text-sm font-black">S</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-black">SubManager</div>
          <div className="text-xs font-semibold text-white/60">panel</div>
        </div>
      </div>

      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Wyszukiwanie"
          className="w-full rounded-2xl bg-white/5 py-2 pl-10 pr-3 text-sm font-semibold text-white placeholder:text-white/50 ring-1 ring-white/10 outline-none focus:bg-white/10"
        />
      </div>

      <div className="mt-5">
        <div className="px-2 text-xs font-black tracking-wide text-white/50">Tworzenie</div>
        <div className="mt-2 space-y-1">
          {filtered
            .filter((x) => itemsCreate.some((y) => y.href === x.href))
            .map((item) => (
              <Row key={item.href} item={item} />
            ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="px-2 text-xs font-black tracking-wide text-white/50">Aplikacje</div>
        <div className="mt-2 space-y-1">
          {filtered
            .filter((x) => itemsApps.some((y) => y.href === x.href))
            .map((item) => (
              <Row key={item.href} item={item} />
            ))}
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="text-xs font-semibold text-white/60">Tryb</div>
          <ThemeToggle />
        </div>

        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="text-xs font-semibold text-white/60">Skrót</div>
          <div className="mt-1 text-sm font-black">Subskrypcja</div>
          <p className="mt-1 text-xs font-semibold text-white/60">
            Zarządzaj subskrypcjami. Dostęp po aktywacji planu.
          </p>
          <Link
            href={props.authenticated ? "/subskrypcja" : "/?auth=login"}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-white px-3 py-2 text-xs font-black text-zinc-950 hover:bg-zinc-100"
          >
            Otwórz
          </Link>
        </div>
      </div>
    </aside>
  );
}
