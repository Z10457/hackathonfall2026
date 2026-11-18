import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Groups" };

export default function GroupsPage() {
  return <PageHeader eyebrow="Groups" title="Groups" description="Coming together." />;
}
