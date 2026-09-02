import Link from "next/link";
import { Award, Gift, Sparkles, Zap } from "lucide-react";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { SideDecoration } from "./components/SideDecoration";
import { RevealOnScroll } from "./components/RevealOnScroll";
import { CheckIcon, ClockIcon, UserIcon, ZapIcon } from "./components/icons";

const REASSURANCES = [
  { icon: CheckIcon, label: "Gratuit à tester" },
  { icon: UserIcon, label: "CV optionnel" },
  { icon: ClockIcon, label: "Résultat en quelques secondes" },
];

const ADVANTAGES = [
  {
    icon: Zap,
    title: "Ultra-rapide",
    text: "Tes questions d'entretien en quelques secondes, pas en plusieurs heures de recherche.",
  },
  {
    icon: Sparkles,
    title: "Taillé pour toi",
    text: "Chaque question colle à la fiche de poste et à ton profil — jamais générique.",
  },
  {
    icon: Award,
    title: "Le niveau d'un vrai recruteur",
    text: "Catégories variées, conseils structurés, méthode de réponse incluse.",
  },
  {
    icon: Gift,
    title: "0€ pour commencer",
    text: "Ta première génération est gratuite, sans carte bancaire ni compte à créer.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CandiView",
  description:
    "Générateur de questions d'entretien à partir d'une fiche de poste, avec conseils pour y répondre",
  url: "https://candiview.fr",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F2E4C] to-[#050B14] px-4 pb-16 pt-14 sm:pb-24 sm:pt-20">
        <div
          aria-hidden
          className="motion-safe:animate-float-slow-1 pointer-events-none absolute -left-32 top-0 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl sm:h-96 sm:w-96"
        />
        <div
          aria-hidden
          className="motion-safe:animate-float-slow-2 pointer-events-none absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl sm:h-[26rem] sm:w-[26rem]"
        />
        <SideDecoration />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm sm:text-sm">
            <ZapIcon className="h-3.5 w-3.5" />
            Générateur IA
          </div>

          <h1
            className="animate-fade-in-up text-3xl font-extrabold leading-tight tracking-tight [animation-fill-mode:backwards] sm:text-5xl sm:leading-[1.15]"
            style={{ animationDelay: "80ms" }}
          >
            <span className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
              Prépare tes entretiens,{" "}
            </span>
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              gagne en confiance
            </span>
          </h1>

          <p
            className="mx-auto mt-5 max-w-xl animate-fade-in-up text-sm text-slate-300 [animation-fill-mode:backwards] sm:text-base"
            style={{ animationDelay: "160ms" }}
          >
            Colle ta fiche de poste, obtiens des questions d&apos;entretien sur
            mesure et les conseils pour y répondre avec assurance.
          </p>

          <div
            className="mt-10 flex animate-fade-in-up justify-center [animation-fill-mode:backwards]"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href="/generateur"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-navy-950 shadow-[0_0_35px_-8px_rgba(16,185,129,0.7)] transition hover:scale-[1.03] hover:bg-emerald-400 hover:shadow-[0_0_45px_-6px_rgba(16,185,129,0.85)] active:scale-[0.98] sm:text-base"
            >
              <ZapIcon className="h-4 w-4" />
              Générer mes questions
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-400 sm:text-sm">
            {REASSURANCES.map(({ icon: Icon, label }, i) => (
              <div
                key={label}
                style={{ animationDelay: `${320 + i * 80}ms` }}
                className="flex animate-fade-in-up items-center gap-2 [animation-fill-mode:backwards]"
              >
                <Icon className="h-4 w-4 text-emerald-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll className="text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
              L&apos;avantage <span className="text-emerald-500">CandiView</span>
            </h2>
          </RevealOnScroll>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ADVANTAGES.map(({ icon: Icon, title, text }, i) => (
              <RevealOnScroll key={title} delayMs={i * 100}>
                <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 text-base font-bold text-navy-900">{title}</h3>
                  <p className="text-sm text-slate-600">{text}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
