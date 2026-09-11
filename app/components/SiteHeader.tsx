"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/generateur", label: "Générer" },
  { href: "/tarifs", label: "Tarifs" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-900/70 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-2 items-center px-4 py-4 sm:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Candi<span className="text-emerald-400">View</span>
        </Link>

        <nav className="col-start-2 flex items-center justify-self-end gap-1 sm:justify-self-center">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-500/10 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
