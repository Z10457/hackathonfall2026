import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, chips). */
  actions?: ReactNode;
}

/** Standard page heading. Use at the top of every route so pages feel consistent. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-5 flex animate-rise flex-wrap items-end justify-between gap-3 lg:mb-7">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title mt-1">{title}</h1>
        <div className="gold-rule mt-3" />
        {description ? <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
