import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef(({ className, leftIcon: LeftIcon, rightSlot, ...props }, ref) => (
  <div className="relative w-full">
    {LeftIcon && (
      <LeftIcon className="input-leading-icon pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
    )}
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-gray-200 bg-surface px-5 py-3.5 text-sm text-text transition-all duration-200",
        "placeholder:text-text-muted/70 focus:border-highlight/50 focus:outline-none focus:ring-4 focus:ring-highlight/10",
        "disabled:cursor-not-allowed disabled:opacity-60",
        LeftIcon && "input-has-leading-icon",
        rightSlot && "input-has-trailing-slot",
        className
      )}
      {...props}
    />
    {rightSlot && <div className="absolute top-1/2 -translate-y-1/2 end-2">{rightSlot}</div>}
  </div>
));

Input.displayName = "Input";
