/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le PDF des CGV (joint a l'email de confirmation, rendu dans le webhook
  // Stripe) utilise @react-pdf/renderer -> pdfkit, qui charge ses polices
  // standard (Helvetica, Helvetica-Bold...) par imports dynamiques
  // "#standard-fonts/*" : le tracage statique de Next.js ne les voit pas, et
  // elles manquaient dans la fonction serverless Vercel ("Cannot find module
  // .../pdfkit/js/standard-fonts/Helvetica.cjs"). On les inclut explicitement.
  // Seule cette route genere un PDF cote serveur (celui des resultats est
  // produit dans le navigateur). A refaire si une autre route rend un PDF.
  outputFileTracingIncludes: {
    "/api/webhooks/stripe": [
      "./node_modules/pdfkit/js/standard-fonts/**/*",
      "./node_modules/pdfkit/js/data/**/*",
    ],
  },
};

export default nextConfig;
