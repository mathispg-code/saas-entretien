import type { Metadata } from "next";
import "./globals.css";

const TITLE = "EntretienIA — Générateur de questions d'entretien par IA";
const DESCRIPTION =
  "Colle une fiche de poste, ajoute ton CV, et obtiens en quelques secondes des questions d'entretien sur mesure avec des conseils pour bien y répondre.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
