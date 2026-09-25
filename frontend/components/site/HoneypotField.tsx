"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

// Phase 20. The cheap half of spam protection: an input no human ever
// fills, which naive form-filling bots fill anyway. The backend
// (lib/spamFilter.js) flags any submission where it arrives non-empty.
//
// Why it's shaped this way:
// - Named "website", not "honeypot" — the name is the bait, and a bot
//   looking for fields worth filling recognizes that one.
// - Hidden with absolute positioning off-screen, NOT `display: none` or
//   `hidden` — better bots skip fields they can tell are unrenderable.
// - aria-hidden + tabIndex={-1} so screen readers never announce it and
//   keyboard tabbing skips straight past it. That's the part that makes
//   this accessible rather than a trap for real users.
// - autoComplete="off" so a browser or password manager doesn't helpfully
//   fill it in and get a genuine visitor flagged.
//
// Rendered identically by all three public forms, hence the shared
// component rather than three copies of these five attributes.
export default function HoneypotField({ value, onChange }: Props) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
    >
      <label>
        Website
        <input
          type="text"
          name="website"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
    </div>
  );
}
