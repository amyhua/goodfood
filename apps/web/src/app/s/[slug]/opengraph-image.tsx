import { ImageResponse } from "next/og";
import { loadShareRender } from "@/server/shares/render";

export const runtime = "nodejs";
export const alt = "A goodfood meal plan with a nutrient proof";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dynamic social thumbnail (F3). Purely generated text/vector — no food photography, so the
 *  "licensed images only" invariant holds. Shows the item title + an honest highlight. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const render = await loadShareRender(slug);
  const title = render?.title ?? "goodfood";
  const summary = render?.summary ?? "Source-traceable meal plans with a nutrient proof";
  const kindLabel = render?.kind === "LIST" ? "Shopping list" : "Meal plan";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 700 }}>
          <span>good</span>
          <span style={{ color: "#86efac" }}>food</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#86efac",
              marginBottom: 12,
            }}
          >
            {kindLabel}
          </div>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.05 }}>
            {title.slice(0, 60)}
          </div>
          <div style={{ display: "flex", fontSize: 34, marginTop: 20, color: "#dcfce7" }}>
            {summary}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#bbf7d0" }}>
          Nutrient proof included · missing data shown as missing, never zero
        </div>
      </div>
    ),
    size,
  );
}
