import type { Metadata } from "next";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";

export const metadata: Metadata = { title: "Reset password" };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Firebase reset links arrive as ?mode=resetPassword&oobCode=...; the local mock uses ?code=...
  const code = first(params.oobCode) || first(params.code);
  return <ResetPasswordView initialEmail={first(params.email)} code={code} />;
}
