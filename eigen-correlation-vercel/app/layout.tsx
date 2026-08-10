import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sector Eigen-Correlation Explorer",
  description:
    "Pick a stock, let AI find its sector peers, and see whether the rest of the group moves with it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
