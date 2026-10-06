"use client";

import { useId } from "react";
import Link from "next/link";

export function CgvConsent({
  checked,
  onChange,
  variant,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant: "light" | "dark";
}) {
  const id = useId();
  const dark = variant === "dark";

  return (
    <div className="flex items-start gap-2.5 text-left">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-emerald-500"
      />
      <label
        htmlFor={id}
        className={`cursor-pointer text-xs leading-snug ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        J&apos;accepte les{" "}
        <Link
          href="/cgv"
          target="_blank"
          rel="noopener noreferrer"
          className={`font-medium underline ${
            dark
              ? "text-emerald-300 hover:text-emerald-200"
              : "text-emerald-600 hover:text-emerald-700"
          }`}
        >
          CGV
        </Link>{" "}
        et je demande l&apos;exécution immédiate du service. Je reconnais
        perdre mon droit de rétractation une fois le service exécuté.
      </label>
    </div>
  );
}
