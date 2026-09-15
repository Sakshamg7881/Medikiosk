import React from 'react'
import { cn } from '@/lib/utils'

const alertVariants = {
  default: 'bg-card text-foreground border-border',
  info: 'bg-primary/5 text-foreground border-primary/20 [&>svg]:text-primary',
  success: 'bg-sage-500/10 text-foreground border-sage-500/25 [&>svg]:text-sage-700 dark:[&>svg]:text-sage-400',
  warning: 'bg-turmeric-500/10 text-foreground border-turmeric-500/25 [&>svg]:text-turmeric-700 dark:[&>svg]:text-turmeric-400',
  destructive: 'bg-destructive/10 text-foreground border-destructive/25 [&>svg]:text-destructive',
}

export function Alert({
  className,
  variant = 'default',
  children,
  ...props
}) {
  const variantClass = alertVariants[variant] || alertVariants.default

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-md border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function AlertTitle({ className, children, ...props }) {
  return (
    <h5
      className={cn('mb-1 font-serif font-medium leading-none tracking-tight text-foreground', className)}
      {...props}
    >
      {children}
    </h5>
  )
}

export function AlertDescription({ className, children, ...props }) {
  return (
    <div
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...props}
    >
      {children}
    </div>
  )
}
