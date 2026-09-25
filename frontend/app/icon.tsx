import { ImageResponse } from "next/og";

// No favicon asset existed before Phase 11 — this generates one from the
// brand tokens (navy background, gold "ZZ" monogram) rather than shipping
// no favicon at all. Swap this for a real designed mark if/when Zee has one;
// it's a logo initial, not a stand-in photo, so it doesn't run into the
// project's real-photography-only rule.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1F3A",
          color: "#D4AF37",
          fontFamily: "sans-serif",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        ZZ
      </div>
    ),
    { ...size }
  );
}
