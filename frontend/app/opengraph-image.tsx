import { ImageResponse } from "next/og";

// Next's file-convention OG image: automatically added to this route
// segment's (and every non-overriding child's) `openGraph.images`. Only
// `/properties/[id]` overrides it, with a real listing photo, when one
// exists — everything else (home, about, services, testimonials, contact,
// the properties grid) falls back to this generated card. A generated
// brand card, not a stand-in "photo" of Zee or a property, so it doesn't
// run into the project's real-photography-only rule for the agent
// headshot/hero.
export const alt = "Zee Zafra Properties — Your property. Your future.";
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
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1F3A",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#D4AF37",
          }}
        >
          Zee Zafra
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            color: "#FAF9F6",
            marginTop: 4,
          }}
        >
          Properties
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#FAF9F6",
            opacity: 0.75,
            marginTop: 28,
          }}
        >
          Your property. Your future.
        </div>
      </div>
    ),
    { ...size }
  );
}
