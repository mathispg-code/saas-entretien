import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { RevealOnScroll } from "../components/RevealOnScroll";
import { CheckIcon } from "../components/icons";
import { PricingButton } from "./components/PricingButton";

export const metadata: Metadata = {
  title: "Tarifs — CandiView",
};

const PLANS = [
  {
    id: "fiche-unique" as const,
    name: "Fiche unique",
    price: "3,99 €",
    period: "paiement unique",
    description: "Pour préparer un entretien précis, sans engagement.",
    features: [
      "Génération complète pour une fiche de poste",
      "Feedback IA personnalisé sur tes réponses",
      "Analyse des points faibles de ton CV incluse",
      "Export PDF de tes questions et conseils",
    ],
    cta: "Choisir cette offre",
    featured: false,
  },
  {
    id: "pass-hebdo" as const,
    name: "Pass hebdomadaire",
    price: "6,99 €",
    // Paiement unique (comme "Fiche unique"), pas un abonnement : donne un
    // acces illimite pendant 7 jours puis s'arrete tout seul, sans jamais
    // redebiter. Le libelle doit rester distinct de "/ mois" (Illimite,
    // vrai abonnement recurrent) pour ne jamais laisser croire a un
    // prelevement hebdomadaire recurrent.
    period: "paiement unique",
    description: "Pour une recherche intensive sur une courte période.",
    features: [
      "Génération illimitée de fiches de poste pendant 7 jours",
      "Feedback IA, analyse de CV et export PDF inclus sur chaque candidature",
      "Jusqu'à 12 questions par fiche, sans supplément",
      "Aucune reconduction automatique",
    ],
    cta: "Choisir cette offre",
    featured: false,
  },
  {
    id: "illimite" as const,
    name: "Illimité",
    price: "9,99 €",
    period: "/ mois",
    description: "Pour multiplier les candidatures sans compter.",
    features: [
      "Génération illimitée de fiches de poste",
      "Feedback IA, analyse de CV et export PDF inclus sur chaque candidature",
      "Jusqu'à 12 questions par fiche, sans supplément",
      "Sans engagement, résiliable à tout moment",
    ],
    cta: "S'abonner",
    featured: true,
  },
];

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="px-4 pb-20 pt-14 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
              Choisis la formule qui te <span className="text-emerald-500">correspond</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
              Une candidature ponctuelle ou une recherche active : à toi de choisir le rythme.
            </p>
          </RevealOnScroll>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <RevealOnScroll key={plan.id} delayMs={i * 100}>
                <div
                  className={`relative mx-auto flex h-full max-w-md flex-col rounded-3xl border bg-white p-8 shadow-sm lg:max-w-none ${
                    plan.featured
                      ? "border-2 border-emerald-400 shadow-[0_0_45px_-15px_rgba(16,185,129,0.5)]"
                      : "border-slate-200"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-navy-950 shadow-sm">
                      Populaire
                    </span>
                  )}

                  <h2 className="text-lg font-bold text-navy-900">{plan.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{plan.description}</p>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-navy-900">{plan.price}</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckIcon className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <PricingButton
                      plan={plan.id}
                      label={plan.cta}
                      variant={plan.featured ? "primary" : "secondary"}
                    />
                  </div>
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
