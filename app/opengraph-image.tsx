import { ImageResponse } from "next/og";

// Edge runtime uses the WASM renderer (no sharp), avoiding the build-time
// "colourspace" prerender error and rendering the card on demand.
export const runtime = "edge";
export const alt = "DigiSutra Solutions — your growth, our sutra";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Site-wide default social share card (1200×630). Routes with their own
   openGraph.images (e.g. blog articles with a cover) override this. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FBF8F4",
          padding: "70px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 66,
              height: 66,
              borderRadius: 16,
              background: "linear-gradient(135deg,#F9922F,#E0510A)",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            DS
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 800, color: "#1c1917", letterSpacing: -0.5 }}>
            DigiSutra Solutions
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 800, color: "#1c1917", lineHeight: 1.05, letterSpacing: -1.5 }}>
            Scale your business with AI-powered growth.
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#E0510A", fontWeight: 700, marginTop: 24 }}>
            Your growth, our sutra.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#78716c" }}>
            <div style={{ display: "flex", width: 13, height: 13, borderRadius: 99, background: "#F26419" }} />
            <div style={{ display: "flex" }}>SEO · Performance Marketing · Web · AI Automation</div>
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#1c1917" }}>digisutrasolutions.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
