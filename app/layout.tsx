import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aero Decoration Studio",
  description: "Create crystal-clear Windows 7 Aero photo decorations in your browser.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
