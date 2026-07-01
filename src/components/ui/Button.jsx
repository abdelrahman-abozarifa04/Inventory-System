import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const variants = {
  primary: "bg-primary text-white shadow-soft hover:bg-primary-light hover:shadow-glow hover:-translate-y-0.5",
  secondary: "border border-border bg-surface text-text hover:border-highlight/30 hover:bg-surface-hover hover:-translate-y-0.5",
  ghost: "text-text-muted hover:bg-highlight-dim hover:text-highlight",
  danger: "border border-danger/20 bg-danger/10 text-danger hover:bg-danger/20 hover:-translate-y-0.5",
  success: "bg-success text-white shadow-soft hover:bg-success/90 hover:shadow-glow hover:-translate-y-0.5",
  subtle: "border border-highlight/15 bg-highlight-dim text-highlight hover:bg-highlight/15 hover:-translate-y-0.5",
  outline: "border border-border bg-transparent text-text hover:border-highlight/40 hover:text-highlight hover:-translate-y-0.5",
};

const sizes = {
  sm: "h-12 gap-2 rounded-xl px-6 py-3 text-xs",
  md: "h-12 gap-2.5 rounded-xl px-6 py-3 text-sm",
  lg: "h-12 gap-3 rounded-2xl px-6 py-3 text-sm",
  xl: "h-14 gap-3 rounded-2xl px-8 text-base",
  icon: "h-11 w-11 rounded-xl p-0",
  iconSm: "h-9 w-9 rounded-lg p-0",
};

const Button = forwardRef(
  ({ className, variant = "primary", size = "md", as: Component = "button", children, motionProps, ...props }, ref) => {
    const MotionComponent = motion(Component);

    return (
      <MotionComponent
        ref={ref}
        whileTap={{ scale: props.disabled ? 1 : 0.97 }}
        transition={{ duration: 0.16 }}
        className={cn(
          "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:pointer-events-none disabled:opacity-55",
          "active:translate-y-[0.5px]",
          variants[variant],
          sizes[size],
          className
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </MotionComponent>
    );
  }
);

Button.displayName = "Button";

export default Button;
