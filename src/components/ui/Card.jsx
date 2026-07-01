import { cn } from "../../lib/utils";

export const Card = ({ className, children, interactive = false, ...props }) => (
  <section
    className={cn(
      "rounded-2xl border border-border bg-surface shadow-card",
      interactive && "transition-all duration-300 hover:-translate-y-1 hover:border-highlight/30 hover:shadow-medium hover:glow-highlight",
      className
    )}
    {...props}
  >
    {children}
  </section>
);

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("border-b border-border bg-surface/95 px-6 py-5 sm:px-8", className)} {...props}>
    {children}
  </div>
);

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("p-8 lg:p-10", className)} {...props}>
    {children}
  </div>
);
