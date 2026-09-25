"use client";

import { useEffect, useRef, useState } from "react";
import { Facebook, MessageCircle, X } from "lucide-react";
import { CHAT_LINKS } from "@/lib/siteConfig";

// Phase 17: deferred from Phase 10 ("Optional: WhatsApp/Messenger
// click-to-chat button alongside the [inquiry] form... additive,
// doesn't replace the DB-backed form" — see the roadmap). This is
// exactly that: a second, external channel, not a replacement for
// InquiryModal/ViewingModal or their DB-backed submissions.
//
// No brand-logo icons exist in the installed lucide-react (checked its
// exports directly — nothing named Whatsapp/Messenger) — a generic
// MessageCircle (emerald, WhatsApp's associated color) and the same
// Facebook icon SOCIAL_LINKS already uses (blue, since Messenger is a
// Meta/Facebook product) are the deliberate substitute, not an
// oversight or a placeholder to swap out later.
//
// Fixed bottom-right, z-30: confirmed against every existing z- usage
// under components/site/ before picking this — sits below the mobile
// drawer overlay (z-40, SiteChrome.tsx) and both modals (z-50,
// InquiryModal.tsx/ViewingModal.tsx), so an open drawer or modal always
// covers it rather than the button floating over either.
export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Click-outside and Escape-to-close, same pattern SiteChrome's mobile
  // drawer uses — a small popover like this should be just as easy to
  // dismiss without hunting for the one exact toggle button again.
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleButtonRef.current?.focus();
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const channelClass =
    "flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-navy shadow-lg transition hover:-translate-y-0.5 dark:bg-navy-light dark:text-offwhite";

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2" role="menu" aria-label="Chat with us">
          <a
            href={CHAT_LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={channelClass}
            role="menuitem"
          >
            Chat on WhatsApp
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <MessageCircle size={16} />
            </span>
          </a>
          <a
            href={CHAT_LINKS.messenger}
            target="_blank"
            rel="noopener noreferrer"
            className={channelClass}
            role="menuitem"
          >
            Message on Facebook
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
              <Facebook size={16} />
            </span>
          </a>
        </div>
      )}

      <button
        ref={toggleButtonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Close chat options" : "Chat with us"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy shadow-lg transition hover:bg-gold-light"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
