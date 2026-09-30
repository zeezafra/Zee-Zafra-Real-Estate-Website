"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Play, X } from "lucide-react";
import { INTRO_VIDEO_URL } from "@/lib/siteConfig";
import { getVideoEmbed } from "@/lib/video";
import { useFocusTrap } from "@/lib/useFocusTrap";
import T from "@/components/i18n/T";

// Trust & polish. The hero's "Watch Introduction" button. Renders nothing
// until INTRO_VIDEO_URL is set in lib/siteConfig.ts (no dead button). A
// YouTube / Vimeo / Facebook URL plays inside a pop-up (reusing the
// existing lib/video.ts embed rules and useFocusTrap hook); any other https
// URL just opens in a new tab.
const LABEL_CLASS =
  "group flex items-center gap-3 rounded-full py-2 pr-3 text-base font-semibold text-offwhite/90 transition hover:text-gold";

function withAutoplay(embedUrl: string, provider: string): string {
  const sep = embedUrl.includes("?") ? "&" : "?";
  return `${embedUrl}${sep}${provider === "facebook" ? "autoplay=true" : "autoplay=1"}`;
}

export default function IntroVideoButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const url = INTRO_VIDEO_URL.trim();
  const isUrl = /^https?:\/\//i.test(url);
  const embed = isUrl ? getVideoEmbed(url) : null;

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    document.body.classList.add("overflow-hidden");
    const focusTimer = setTimeout(() => closeRef.current?.focus(), 0);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("overflow-hidden");
      trigger?.focus();
    };
  }, [open]);

  if (!isUrl) return null;

  const icon = (
    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-offwhite/60 bg-white/10 backdrop-blur-sm transition group-hover:border-gold group-hover:bg-gold group-hover:text-navy">
      <Play size={16} className="ml-0.5 fill-current" aria-hidden="true" />
    </span>
  );

  // Not embeddable (or a host we don't recognise): plain link, same look.
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`${LABEL_CLASS} ${className}`}>
        {icon}
        <T id="hero.watch">Watch Introduction</T>
      </a>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`${LABEL_CLASS} ${className}`}
      >
        {icon}
        <T id="hero.watch">Watch Introduction</T>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-video-title"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
          />
          <div ref={panelRef} className="relative w-full max-w-3xl">
            <div className="mb-3 flex items-center justify-between text-offwhite">
              <h2 id="intro-video-title" className="text-lg font-semibold">
                <T id="video.title">Introduction</T>
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
              <iframe
                src={withAutoplay(embed.embedUrl, embed.provider)}
                title="Introduction video"
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
            {/* Facebook embeds refuse private/friends-only videos; a plain
                link is the fallback for that and for blocked iframes. */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-offwhite/70 underline-offset-4 hover:text-gold hover:underline"
            >
              <T id="video.external">Open the video in a new tab</T>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
