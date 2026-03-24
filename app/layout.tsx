// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: { default: "FairwayHeart — Golf with Purpose", template: "%s | FairwayHeart" },
  description: "Subscribe. Score. Win. Give. The platform that turns your golf game into charitable impact.",
  keywords: ["golf", "charity", "subscription", "prize draw", "stableford"],
  openGraph: {
    title: "FairwayHeart — Golf with Purpose",
    description: "Turn your golf game into charitable impact. Win monthly prizes while supporting causes you care about.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#142414",
              color: "#e8f5e0",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#050a05" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#050a05" } },
          }}
        />
      </body>
    </html>
  );
}
