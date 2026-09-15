import React from 'react'
import { cn } from '@/lib/utils'

export function Progress({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100)

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  const barColors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-muted border border-border/40',
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full transition-all duration-300 ease-out rounded-full',
          barColors[variant] || barColors.primary
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
