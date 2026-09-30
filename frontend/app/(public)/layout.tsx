import SiteChrome from "@/components/site/SiteChrome";
import { InquiryModalProvider } from "@/components/site/InquiryModalProvider";
import { ViewingModalProvider } from "@/components/site/ViewingModalProvider";
import FloatingChatButton from "@/components/site/FloatingChatButton";
import CompareBar from "@/components/site/CompareBar";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

// Scoped to the (public) route group so the branding shell (sidebar, mobile
// header/drawer) wraps the marketing site only — /admin has its own layout
// and deliberately doesn't get this chrome.
//
// InquiryModalProvider (Phase 10) lives here rather than the root layout —
// the modal it renders is a public-site concept ("Inquire Now" / "Get in
// Touch"), not something /admin has any use for.
//
// ViewingModalProvider (Phase 14) sits alongside it for the same reason —
// "Book a Viewing" is also public-only — as its own provider rather than
// folded into InquiryModalProvider, since the two modals have independent
// open/closed state and are triggered by different buttons.
//
// FloatingChatButton (Phase 17) sits outside SiteChrome, as a sibling —
// same public-only reasoning, but it needs no provider: it's a single
// global element with its own local open/closed state, not something any
// other component ever needs to trigger (unlike the two modals above,
// which InquireButton/BookViewingButton open from all over the site).
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Trust & polish: LanguageProvider is outermost so the sidebar, both
  // modals, and every page's <T> labels share one language choice.
  return (
    <LanguageProvider>
      <InquiryModalProvider>
        <ViewingModalProvider>
          <SiteChrome>{children}</SiteChrome>
          <FloatingChatButton />
          <CompareBar />
        </ViewingModalProvider>
      </InquiryModalProvider>
    </LanguageProvider>
  );
}
