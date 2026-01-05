"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="w-56 rounded-md border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-950 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
    >
      {loading ? "Wylogowywanie..." : "wyloguj"}
    </button>
  );
}
