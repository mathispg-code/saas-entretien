import type { Metadata } from "next";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { MonAccesClient } from "./MonAccesClient";

export const metadata: Metadata = {
  title: "Mon accès — CandiView",
  // Page personnelle : ne doit jamais apparaitre dans les moteurs de recherche.
  robots: { index: false, follow: false },
};

export default function MonAccesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="mx-auto max-w-lg px-4 pb-20 pt-12 sm:pt-16">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
          Mon accès
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Retrouve l&apos;état de ton Pass hebdomadaire ou de ton abonnement Illimité, sans mot de
          passe ni compte.
        </p>

        <MonAccesClient />
      </main>

      <SiteFooter />
    </div>
  );
}
