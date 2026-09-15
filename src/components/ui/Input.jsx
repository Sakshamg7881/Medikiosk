import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef(function Input(
  {
    className,
    type = 'text',
    sizeVariant = 'md',
    error,
    ...props
  },
  ref
) {
  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-10 px-3.5 py-2 text-sm',
    lg: 'h-13 px-4 py-3 text-base', // High visibility for patient kiosk
  }

  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex w-full rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        sizeClasses[sizeVariant] || sizeClasses.md,
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      {...props}
    />
  )
})
