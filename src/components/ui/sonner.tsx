"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { Icon } from "@/components/ui/icon"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <Icon name="check_circle" size="sm" fill className="text-emerald-500" />,
        info: <Icon name="info" size="sm" fill className="text-primary" />,
        warning: <Icon name="warning" size="sm" fill className="text-amber-500" />,
        error: <Icon name="error" size="sm" fill className="text-destructive" />,
        loading: <Icon name="progress_activity" size="sm" className="animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
