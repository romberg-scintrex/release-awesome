import { ImageResponse } from "next/og";
import { SITE } from "@/lib/utils";

// Branded 1200×630 social-preview card (LinkedIn, X, WhatsApp, etc.).
// Next automatically wires this into the page's og:image and twitter:image.
export const alt = "Gregorius Dimas A Yudhana - Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0a0812 0%, #1c162b 60%, #2a1a45 100%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#a78bfa",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          {SITE.url.replace("https://", "")}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.02,
              letterSpacing: -2,
            }}
          >
            Gregorius Dimas A Yudhana
          </div>
          <div style={{ display: "flex", fontSize: 42, color: "#cbd5e1", marginTop: 20 }}>
            Software Engineer
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 28, color: "#94a3b8" }}>
          Universitas Brawijaya · Jakarta, Indonesia
        </div>
      </div>
    ),
    { ...size },
  );
}
