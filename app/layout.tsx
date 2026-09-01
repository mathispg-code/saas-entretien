import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Générateur de questions d'entretien",
  description:
    "Colle une fiche de poste et obtiens des questions d'entretien probables avec des conseils pour y répondre.",
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
