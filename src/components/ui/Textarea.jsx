import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Textarea = forwardRef(function Textarea(
  {
    className,
    error,
    rows = 4,
    ...props
  },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'flex w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y',
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      {...props}
    />
  )
})
