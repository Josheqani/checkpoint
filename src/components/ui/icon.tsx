import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
  size?: "xs" | "sm" | "default" | "md" | "lg" | "xl";
}

const sizeClasses: Record<NonNullable<IconProps["size"]>, string> = {
  xs: "text-[14px] w-3.5 h-3.5",
  sm: "text-[16px] w-4 h-4",
  default: "text-[20px] w-5 h-5",
  md: "text-[24px] w-6 h-6",
  lg: "text-[28px] w-7 h-7",
  xl: "text-[32px] w-8 h-8",
};

export function Icon({
  name,
  fill = false,
  size = "default",
  className,
  ...props
}: IconProps) {
  return (
    <span
      className={cn(
        "material-symbols-rounded select-none inline-flex items-center justify-center shrink-0 leading-none",
        sizeClasses[size],
        fill && "[font-variation-settings:'FILL'_1]",
        className
      )}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
}
