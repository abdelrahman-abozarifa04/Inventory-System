import { cn } from "../../lib/utils";

const Section = ({ eyebrow, title, description, actions, className, children }) => (
  <div className={cn("space-y-6", className)}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary/70">{eyebrow}</p>}
        <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

export default Section;
