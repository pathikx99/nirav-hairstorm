"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "../context/AppContext";

export function Navbar() {
  const pathname = usePathname();
  const { mode, setMode } = useApp();

  const navLinks = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/starting-hair", label: "1. Hair Check", icon: "📸" },
    { href: "/target-colour", label: "2. Choose Look", icon: "🎨" },
    { href: "/formulation", label: "3. Mix & Apply", icon: "🥣" },
    { href: "/avatar-studio", label: "Avatar Studio", icon: "👤" },
  ];

  const handleToggleMode = () => {
    const next = mode === "STYLIST" ? "CHEMIST" : "STYLIST";
    setMode(next);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 font-black text-white shadow-md text-sm">
              NH
            </span>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                Nirav Hairstorm
              </span>
              <span className="hidden md:inline-block ml-2 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.2 text-[10px] font-bold text-amber-300">
                Salon Edition
              </span>
            </div>
          </Link>

          {/* Navigation Links with Icons */}
          <nav className="hidden sm:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                      : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Stylist vs Chemist Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleToggleMode}
            className={`rounded-xl border px-2.5 py-1.5 text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-1 ${
              mode === "STYLIST"
                ? "border-amber-500 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500"
                : "border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500"
            }`}
            title="Toggle between Stylist (Visual) and Chemist (Technical) view"
          >
            <span>{mode === "STYLIST" ? "✂️" : "🧪"}</span>
            <span className="hidden xs:inline">{mode === "STYLIST" ? "Stylist" : "Chemist"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Step Bar */}
      <div className="sm:hidden flex items-center justify-around border-t border-neutral-900 bg-neutral-950 px-2 py-1.5">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? "bg-amber-500 text-neutral-950 font-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span className="text-sm">{link.icon}</span>
              <span>{link.label.split(". ")[1] || link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
