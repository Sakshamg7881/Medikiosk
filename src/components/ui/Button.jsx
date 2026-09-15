import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = {
  variant: {
    default: 'bg-primary text-primary-foreground hover:bg-pine-800 dark:hover:bg-pine-600 border border-transparent',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-sage-600 dark:hover:bg-sage-400 border border-transparent',
    outline: 'border border-border bg-card hover:bg-muted text-foreground',
    ghost: 'hover:bg-muted text-foreground',
    accent: 'bg-accent text-accent-foreground hover:bg-turmeric-600 dark:hover:bg-turmeric-400 border border-transparent',
    link: 'text-primary underline-offset-4 hover:underline p-0 h-auto border-0',
  },
  size: {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-7 text-lg font-medium', // Accessible touch target for patient kiosk
    icon: 'h-10 w-10 p-0 flex items-center justify-center',
  },
}

export const Button = forwardRef(function Button(
  {
    className,
    variant = 'default',
    size = 'md',
    disabled = false,
    type = 'button',
    children,
    ...props
  },
  ref
) {
  const variantClass = buttonVariants.variant[variant] || buttonVariants.variant.default
  const sizeClass = buttonVariants.size[size] || buttonVariants.size.md

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none rounded-md',
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
