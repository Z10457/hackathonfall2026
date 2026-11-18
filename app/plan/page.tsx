import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return <PageHeader eyebrow="Plan" title="Plan" description="Coming together." />;
}
