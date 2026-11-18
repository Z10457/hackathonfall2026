import { ShieldCheck } from "lucide-react";

const TIPS: string[] = [
  "Meet in public campus spots such as the Ram Van office or the McShane and Lowenstein lobbies.",
  "Keep conversations in the app until you know someone.",
  "Do not share your home address or exact location.",
  "Tell a friend your route and when you expect to arrive.",
  "Report anything that makes you uncomfortable.",
];

export function SafetyTips() {
  return (
    <aside className="card border-gold-400/60 bg-gold-100/40 p-5" aria-labelledby="safety-tips">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-maroon-700" aria-hidden />
        <h2 id="safety-tips" className="text-lg font-bold text-ink-900">Safety tips</h2>
      </div>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-700">
        {TIPS.map((tip) => (
          <li key={tip} className="flex gap-2">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
            {tip}
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-white px-3 py-2.5 text-sm text-ink-700">
        In an emergency, call Fordham Public Safety at{" "}
        <a href="tel:7188172222" className="font-bold whitespace-nowrap text-maroon-700 underline">(718) 817-2222</a>.
      </p>
    </aside>
  );
}
