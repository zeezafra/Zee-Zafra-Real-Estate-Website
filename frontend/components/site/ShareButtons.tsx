"use client";

import { useEffect, useState } from "react";
import { Check, Facebook, Link2, MessageCircle, Share2, Twitter } from "lucide-react";

type Props = {
  url: string;
  title: string;
  className?: string;
};

// Used on the property detail page (aside, below the Inquire/Save buttons).
// Always renders the three platform links + copy-link so "share this
// listing" works everywhere; adds a native "Share" button on top of that
// on devices/browsers that support navigator.share (mostly mobile) rather
// than replacing the row with it — a user shouldn't lose the explicit
// platform links just because their browser also offers a share sheet.
export default function ShareButtons({ url, title, className }: Props) {
  const [copied, setCopied] = useState(false);
  // Checked in an effect (not inline) so the first client render matches
  // the server render — navigator.share is never defined during SSR, and
  // checking it inline would cause a hydration mismatch.
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // AbortError when the user cancels the native sheet, or any other
      // failure — the row below is always there as a fallback, so this
      // isn't worth surfacing as an error.
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, non-secure context) — the
      // other share links still work, so fail quietly here too.
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "Share on Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "Share on X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Share on WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  const iconButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-navy/15 text-navy transition hover:border-gold hover:text-gold dark:border-offwhite/15 dark:text-offwhite";

  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-navy/50 dark:text-offwhite/50">
        Share this listing
      </p>
      <div className="mt-2 flex items-center gap-2">
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            aria-label="Share"
            className={iconButtonClass}
          >
            <Share2 size={16} />
          </button>
        )}
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={iconButtonClass}
          >
            <link.icon size={16} />
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label="Copy link"
          className={iconButtonClass}
        >
          {copied ? <Check size={16} /> : <Link2 size={16} />}
        </button>
      </div>
    </div>
  );
}
