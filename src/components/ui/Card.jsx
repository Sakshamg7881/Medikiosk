import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-md border border-border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
})

export const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
})

export const CardTitle = forwardRef(function CardTitle({ className, children, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn('font-serif text-lg font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    >
      {children}
    </h3>
  )
})

export const CardDescription = forwardRef(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
})

export const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      {...props}
    />
  )
})

export const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
})
