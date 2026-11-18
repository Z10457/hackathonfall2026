import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Classmates" };

export default function ClassmatesPage() {
  return <PageHeader eyebrow="Classmates" title="Classmates" description="Coming together." />;
}
