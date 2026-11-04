import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "Nirav Hairstorm — Universal Hair Colour Intelligence Platform",
  description:
    "Professional hair colour assessment, universal UHCR representation, cross-brand mapping, and deterministic constraint-based formulation engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-800 bg-neutral-950/80 py-6 text-center text-xs text-neutral-500">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              © 2026 Nirav Hairstorm — Universal Hair Colour Representation (UHCR v1.0).
            </p>
            <p className="text-[11px] text-neutral-400">
              Strict Non-Negotiable Invariant: Similar visual colour does not establish chemical equivalence.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
