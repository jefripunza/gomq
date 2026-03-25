import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 rounded-xl border border-dark-600/50 bg-dark-900/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

export { Select };
