// Phase 25. Turns the URL an admin pasted into something the property page
// can show: an embeddable iframe src for the hosts we know how to embed
// (YouTube, Vimeo, Facebook), or null for anything else, in which case the
// page falls back to a plain "Watch video" link instead of a broken embed.

export type VideoEmbed = { embedUrl: string; provider: "youtube" | "vimeo" | "facebook" };

export function getVideoEmbed(rawUrl: string | null | undefined): VideoEmbed | null {
  if (!rawUrl) return null;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  // YouTube: watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID, /live/ID
  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
    let id: string | null = null;
    if (host === "youtu.be") {
      id = url.pathname.split("/")[1] || null;
    } else if (url.pathname === "/watch") {
      id = url.searchParams.get("v");
    } else {
      const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/);
      id = m ? m[1] : null;
    }
    if (id && /^[\w-]{6,20}$/.test(id)) {
      return { embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, provider: "youtube" };
    }
    return null;
  }

  // Vimeo: vimeo.com/123456789
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(\d{5,})/);
    if (m) return { embedUrl: `https://player.vimeo.com/video/${m[1]}`, provider: "vimeo" };
    return null;
  }

  // Facebook videos / reels / watch links. Facebook's own embed plugin takes
  // the public post URL as `href`. Private or friends-only videos won't play
  // inside the embed — the fallback link below the player covers that.
  if (host === "facebook.com" || host === "fb.watch") {
    return {
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        url.toString()
      )}&show_text=false`,
      provider: "facebook",
    };
  }

  return null;
}
