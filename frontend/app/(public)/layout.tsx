import SiteChrome from "@/components/site/SiteChrome";

// Scoped to the (public) route group so the branding shell (sidebar, mobile
// header/drawer) wraps the marketing site only — /admin has its own layout
// and deliberately doesn't get this chrome.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
