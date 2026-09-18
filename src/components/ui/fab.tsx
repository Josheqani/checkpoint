import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fabVariants = cva(
  "inline-flex items-center justify-center font-medium shadow-md transition-all duration-200 hover:shadow-lg active:shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-container text-on-primary-container hover:bg-primary-container/85",
        surface:
          "bg-surface-container-high text-primary hover:bg-surface-container-highest",
        secondary:
          "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/85",
        filled:
          "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      size: {
        default: "h-14 w-14 rounded-2xl p-0 [&_svg]:size-6",
        small: "h-10 w-10 rounded-xl p-0 [&_svg]:size-5",
        large: "h-24 w-24 rounded-3xl p-0 [&_svg]:size-9",
        extended:
          "h-14 px-6 rounded-2xl gap-3 text-sm tracking-wide [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface FabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {}

const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(fabVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Fab.displayName = "Fab";

export { Fab, fabVariants };
