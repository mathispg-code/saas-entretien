import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CandiView — Générateur de questions d'entretien par IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(to bottom, #0F2E4C, #050B14)",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <svg width="72" height="72" viewBox="0 0 24 24" fill="#10B981">
            <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              color: "white",
            }}
          >
            Candi
            <span style={{ color: "#10B981" }}>View</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 32,
            color: "#CBD5E1",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Des questions d&apos;entretien sur mesure, générées par IA en
          quelques secondes
        </div>
      </div>
    ),
    { ...size },
  );
}
