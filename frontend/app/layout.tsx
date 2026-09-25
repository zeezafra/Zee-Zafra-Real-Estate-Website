import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { SITE_URL } from "@/lib/siteConfig";

// metadataBase turns every relative URL used in metadata (the OG image
// route below, per-page canonical URLs) into an absolute one — required
// for Open Graph/Twitter cards to resolve correctly when shared.
// openGraph/twitter here are the site-wide defaults; pages that don't
// define their own (everything except /properties/[id], which sets a
// per-property image) inherit these, including the generated
// app/opengraph-image.tsx picked up automatically by Next.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Zee Zafra Properties",
    template: "%s | Zee Zafra Properties",
  },
  description: "Your property. Your future.",
  openGraph: {
    type: "website",
    siteName: "Zee Zafra Properties",
    title: "Zee Zafra Properties",
    description: "Your property. Your future.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zee Zafra Properties",
    description: "Your property. Your future.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
