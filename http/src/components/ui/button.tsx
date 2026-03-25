import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variants: Record<string, string> = {
      default:
        "bg-accent-500 text-white hover:bg-accent-600 shadow-sm hover:shadow-lg hover:shadow-accent-500/25",
      outline:
        "border border-dark-600/50 text-dark-200 hover:bg-dark-700/50 hover:text-foreground hover:border-dark-500/60",
      ghost: "text-dark-300 hover:bg-dark-700/50 hover:text-foreground",
      destructive:
        "bg-neon-red/80 text-white hover:bg-neon-red shadow-sm",
    };

    const sizes: Record<string, string> = {
      sm: "h-8 px-3 text-xs gap-1",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
