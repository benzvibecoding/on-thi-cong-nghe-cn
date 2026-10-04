import type { Metadata } from "next";
import { SetupExam } from "@/features/exam/SetupExam";

export const metadata: Metadata = { title: "Thi thử" };

export default function ThiThuPage() {
  return <SetupExam />;
}
