import { cn } from "../../lib/utils";

export const PageTitle = ({ className, children }) => (
  <h2 className={cn("text-2xl font-bold tracking-tight text-text sm:text-3xl", className)}>{children}</h2>
);

export const MutedText = ({ className, children }) => (
  <p className={cn("text-sm leading-6 text-text-muted", className)}>{children}</p>
);

export const Kicker = ({ className, children }) => (
  <p className={cn("text-xs font-bold uppercase tracking-wider text-primary/70", className)}>{children}</p>
);

export const SectionTitle = ({ className, children }) => (
  <h3 className={cn("text-lg font-semibold tracking-tight text-text sm:text-xl", className)}>{children}</h3>
);

export const Subtitle = ({ className, children }) => (
  <p className={cn("text-sm font-medium text-text-muted", className)}>{children}</p>
);

export const Caption = ({ className, children }) => (
  <p className={cn("text-xs text-text-muted", className)}>{children}</p>
);

export const LabelText = ({ className, children }) => (
  <span className={cn("text-xs font-semibold uppercase tracking-wider text-text-muted", className)}>{children}</span>
);
