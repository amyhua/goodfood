import type { Metadata, Viewport } from "next";
import { appBaseUrl } from "@/lib/app-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: {
    default: "goodfood — nutrition meal planner",
    template: "%s — goodfood",
  },
  description: "Source-traceable meal plans with a nutrient proof table.",
  applicationName: "goodfood",
  openGraph: {
    siteName: "goodfood",
    type: "website",
    title: "goodfood — nutrition meal planner",
    description: "Source-traceable meal plans with a nutrient proof table.",
  },
  twitter: {
    card: "summary_large_image",
    title: "goodfood — nutrition meal planner",
    description: "Source-traceable meal plans with a nutrient proof table.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
