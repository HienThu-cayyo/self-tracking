"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useTheme } from "@/_shared/ui/theme-provider"

export function Toaster(props: ToasterProps) {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="top-right"
      richColors
      containerAriaLabel="Thông báo"
      toastOptions={{
        classNames: {
          toast: "shadow-lg",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}
