import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const TITLE = "CandiView – Prépare tes entretiens, gagne en confiance";
const DESCRIPTION =
  "Colle une fiche de poste, reçois des questions d'entretien ciblées et des conseils pour y répondre sereinement. Simple et rapide.";

export const metadata: Metadata = {
  metadataBase: new URL("https://candiview.fr"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "fr_FR",
    url: "https://candiview.fr",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  verification: {
    google: "nV0weLrjj9pkS-R2hsyDh4EfAaJjBfj-sKNQX7F0SKE",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
