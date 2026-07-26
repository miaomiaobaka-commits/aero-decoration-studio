import type { Metadata } from "next";
import AeroStudio from "./AeroStudio";

export const metadata: Metadata = {
  title: "Aero Decoration Studio",
  description: "A nostalgic Windows 7 Aero image decoration studio.",
};

export default function Home() {
  return <AeroStudio />;
}
