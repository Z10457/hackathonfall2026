import { BRAND_ASSETS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-line px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND_ASSETS.logo} alt="Fordham University" width={112} height={30} className="h-7 w-auto opacity-90" />
        <p className="max-w-2xl text-xs leading-relaxed text-ink-500">
          Ram Hub is a student project and is not affiliated with Fordham University operations. Live van positions
          are simulated demo data.
        </p>
      </div>
    </footer>
  );
}
