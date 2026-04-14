import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Judge.run",
  description: "Realtime judging operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-100">{children}</body>
    </html>
  );
}
