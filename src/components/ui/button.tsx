import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        // M3 Filled (High emphasis)
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/92 hover:shadow-sm",
        filled:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/92 hover:shadow-sm",
        // M3 Elevated
        elevated:
          "bg-surface-container-low text-primary shadow-xs hover:shadow-sm hover:bg-surface-container",
        // M3 Tonal (Medium-high emphasis)
        secondary:
          "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80",
        tonal:
          "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80",
        // M3 Outlined (Medium emphasis)
        outline:
          "border border-outline/40 bg-transparent text-primary hover:bg-primary/8 active:bg-primary/12",
        outlined:
          "border border-outline/40 bg-transparent text-primary hover:bg-primary/8 active:bg-primary/12",
        // M3 Text (Low emphasis)
        ghost:
          "text-primary hover:bg-primary/8 active:bg-primary/12",
        text:
          "text-primary hover:bg-primary/8 active:bg-primary/12",
        // M3 Error / Destructive
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
