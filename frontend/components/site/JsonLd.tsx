// Phase 25. Renders one JSON-LD <script>. `<` is escaped to \u003c so text
// that came from the admin (a listing description containing "</script>")
// can never close the tag early — JSON.stringify alone doesn't do that.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
