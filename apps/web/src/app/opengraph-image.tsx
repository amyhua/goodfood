import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "goodfood — source-traceable meal planning";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card (F7) for every route without its own opengraph-image. Generated
 *  text/vector only — no licensed imagery. */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 48, fontWeight: 800 }}>
          <span>good</span>
          <span style={{ color: "#86efac" }}>food</span>
        </div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 800, marginTop: 24, lineHeight: 1.1 }}>
          Meal plans you can trust
        </div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 20, color: "#dcfce7", maxWidth: 900 }}>
          A source-linked nutrient proof with every plan. Free &amp; open source. Missing data shown as
          missing, never zero.
        </div>
      </div>
    ),
    size,
  );
}
