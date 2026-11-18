import type { Metadata } from "next";
import { ClassmatesView } from "@/components/classmates/ClassmatesView";

export const metadata: Metadata = { title: "Classmates" };

export default function ClassmatesPage() {
  return <ClassmatesView />;
}
