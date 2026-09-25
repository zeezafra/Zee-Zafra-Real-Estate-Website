import { ImageResponse } from "next/og";

// Same monogram as icon.tsx, sized for iOS home-screen bookmarks.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 76,
          fontWeight: 700,
        }}
      >
        ZZ
      </div>
    ),
    { ...size }
  );
}
