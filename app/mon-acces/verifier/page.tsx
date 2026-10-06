import type { Metadata } from "next";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";
import { VerifierClient } from "./VerifierClient";

export const metadata: Metadata = {
  title: "Retrouver mon accès — CandiView",
  robots: { index: false, follow: false },
  // Aucune adresse de cette page ne doit etre transmise aux sites tiers.
  referrer: "no-referrer",
};

export default function VerifierPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="mx-auto max-w-lg px-4 pb-20 pt-12 sm:pt-16">
        <VerifierClient />
      </main>

      <SiteFooter />
    </div>
  );
}
