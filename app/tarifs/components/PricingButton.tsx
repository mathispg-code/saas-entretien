"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { CgvConsent } from "../../components/CgvConsent";

// Paiement pas encore branche sur cette page (voir TODO.md) : clic = retour
// visuel + log, jamais de redirection ni d'etat "paiement en cours" qui
// laisserait croire a une vraie transaction. Le vrai Stripe pour "Fiche
// unique" existe deja mais ailleurs (flux /generateur, ou un generationId
// precis est requis — voir UnlockModal). A garder en tete pour la suite :
// - "pass-hebdo" reste un paiement UNIQUE (comme "fiche-unique"), pas un
//   abonnement — Stripe Checkout mode "payment".
// - "illimite" est un vrai ABONNEMENT recurrent — Stripe Checkout mode
//   "subscription", avec gestion de la resiliation.
export function PricingButton({
  plan,
  label,
  variant,
}: {
  plan: "fiche-unique" | "pass-hebdo" | "illimite";
  label: string;
  variant: "primary" | "secondary";
}) {
  const [selected, setSelected] = useState(false);
  // Case CGV obligatoire : le bouton reste inactif tant qu'elle n'est pas
  // cochee (demande d'execution immediate + renonciation a la retractation).
  const [accepted, setAccepted] = useState(false);

  function handleClick() {
    console.log(`Offre sélectionnée : ${plan}`);
    setSelected(true);
    setTimeout(() => setSelected(false), 1800);
  }

  const baseClasses =
    "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-default";
  const variantClasses =
    variant === "primary"
      ? "bg-emerald-500 text-navy-950 shadow-[0_0_25px_-8px_rgba(16,185,129,0.7)] enabled:hover:bg-emerald-400 enabled:hover:scale-[1.02] enabled:active:scale-[0.98]"
      : "border border-navy-300 text-navy-800 enabled:hover:border-emerald-400 enabled:hover:text-emerald-600";
  const lockedClasses = !accepted && !selected ? "cursor-not-allowed opacity-50" : "";

  return (
    <div className="space-y-3">
      <CgvConsent checked={accepted} onChange={setAccepted} variant="light" />
      <button
        type="button"
        onClick={handleClick}
        disabled={selected || !accepted}
        className={`${baseClasses} ${variantClasses} ${lockedClasses}`}
      >
        {selected ? (
          <>
            <Check className="h-4 w-4" />
            Sélectionné
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}
