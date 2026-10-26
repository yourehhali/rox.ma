// Injects JSON-LD structured data into the page body. Google reads valid
// JSON-LD wherever it appears, and rendering it in the tree keeps it SSR-safe
// without relying on the router's head <script> API.
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
