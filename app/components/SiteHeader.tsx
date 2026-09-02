import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-900/70 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Candi<span className="text-emerald-400">View</span>
        </Link>
      </div>
    </header>
  );
}
