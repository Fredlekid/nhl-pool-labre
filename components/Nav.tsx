"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsAdmin(document.cookie.includes("nhl_admin_session"));
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdmin(false);
    router.push("/");
    router.refresh();
  }

  const links = (
    <>
      <Link
        href="/"
        className={`text-sm font-medium transition-colors ${pathname === "/" ? "text-blue-700" : "text-slate-600 hover:text-slate-900"}`}
      >
        Leaderboard
      </Link>
      <Link
        href="/join"
        className="text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Join the Pool
      </Link>
      {isAdmin ? (
        <>
          <Link
            href="/admin"
            className={`text-sm font-medium transition-colors ${pathname === "/admin" ? "text-blue-700" : "text-slate-600 hover:text-slate-900"}`}
          >
            Admin
          </Link>
          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign out
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl">🏒</span>
          <div>
            <p className="font-black text-slate-900 leading-none text-base tracking-tight">
              2026 PLAYOFFS
            </p>
            <p className="text-xs font-bold text-blue-700 tracking-widest leading-none mt-0.5">
              LABRE
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">{links}</nav>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-4">
          {links}
        </div>
      )}
    </header>
  );
}
