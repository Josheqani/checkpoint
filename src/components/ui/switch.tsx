"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=unchecked]:bg-surface-container-highest data-[state=unchecked]:border-outline/60",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block rounded-full shadow-xs transition-all duration-200 data-[state=checked]:h-6 data-[state=checked]:w-6 data-[state=checked]:bg-primary-foreground data-[state=checked]:translate-x-6 rtl:data-[state=checked]:-translate-x-6 data-[state=unchecked]:h-4 data-[state=unchecked]:w-4 data-[state=unchecked]:bg-outline data-[state=unchecked]:translate-x-1 rtl:data-[state=unchecked]:-translate-x-1"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
