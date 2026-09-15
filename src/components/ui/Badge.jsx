import React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = {
  default: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground',
  secondary: 'bg-muted text-muted-foreground border-border',
  outline: 'bg-transparent text-foreground border-border',
  accent: 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-foreground border-accent/20',
  success: 'bg-sage-500/15 text-sage-800 dark:text-sage-300 border-sage-500/30',
  warning: 'bg-turmeric-500/15 text-turmeric-800 dark:text-turmeric-300 border-turmeric-500/30',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}) {
  const variantClass = badgeVariants[variant] || badgeVariants.default

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wider transition-colors',
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
