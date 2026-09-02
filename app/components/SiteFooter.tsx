import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
        <Link href="/mentions-legales" className="hover:text-slate-600">
          Mentions légales
        </Link>
        <Link href="/confidentialite" className="hover:text-slate-600">
          Politique de confidentialité
        </Link>
        <a
          href="mailto:ton-email@exemple.com?subject=Retour%20sur%20CandiView"
          className="hover:text-slate-600"
        >
          Un bug ? Une suggestion ?
        </a>
      </div>
    </footer>
  );
}
