import Link from "next/link";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { CheckIcon, ClockIcon, UserIcon, ZapIcon } from "./components/icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F2E4C] to-[#050B14] px-4 pb-16 pt-14 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm sm:text-sm">
            <ZapIcon className="h-3.5 w-3.5" />
            Générateur IA
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl sm:leading-[1.15]">
            <span className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
              Prépare ton entretien en{" "}
            </span>
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              30 secondes chrono
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm text-slate-300 sm:text-base">
            Colle ta fiche de poste, obtiens des questions d&apos;entretien sur
            mesure et les conseils pour y répondre avec assurance.
          </p>

          <div className="mt-10 flex justify-center">
            <Link
              href="/generateur"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-navy-950 shadow-[0_0_35px_-8px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 hover:shadow-[0_0_45px_-6px_rgba(16,185,129,0.85)] sm:text-base"
            >
              <ZapIcon className="h-4 w-4" />
              Générer mes questions
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-400 sm:text-sm">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400" />
              Gratuit à tester
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-emerald-400" />
              CV optionnel
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-emerald-400" />
              Résultat en quelques secondes
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
