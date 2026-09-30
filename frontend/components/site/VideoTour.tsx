import { ExternalLink } from "lucide-react";
import { getVideoEmbed } from "@/lib/video";

// Phase 25. Server component. Embeds YouTube/Vimeo/Facebook; anything else
// (TikTok, Google Drive, etc.) renders as a plain link instead of a broken
// player. A fallback link is always shown under the player because Facebook
// embeds silently fail for non-public videos.
export default function VideoTour({ url, title }: { url: string; title: string }) {
  const embed = getVideoEmbed(url);

  return (
    <section aria-labelledby="video-heading" className="mt-8 border-t border-navy/10 pt-8 dark:border-offwhite/10">
      <h2 id="video-heading" className="text-lg font-semibold text-navy dark:text-offwhite">
        Video Tour
      </h2>

      {embed && (
        <div className="mt-4 aspect-video overflow-hidden rounded-2xl bg-navy">
          <iframe
            title={`Video tour of ${title}`}
            src={embed.embedUrl}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full border-0"
          />
        </div>
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold underline-offset-4 hover:underline"
      >
        <ExternalLink size={14} />
        {embed ? "Can't play it? Open the video" : "Watch the video tour"}
      </a>
    </section>
  );
}
