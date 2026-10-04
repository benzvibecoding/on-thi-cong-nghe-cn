import type { Metadata } from "next";
import { StudioEditor } from "@/features/studio/StudioEditor";

export const metadata: Metadata = {
  title: "Question Studio",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <StudioEditor />;
}
