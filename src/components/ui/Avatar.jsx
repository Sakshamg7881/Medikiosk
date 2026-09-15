import React, { useState } from 'react'
import { cn } from '@/lib/utils'

export function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function AvatarImage({ src, alt = '', className, ...props }) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) return null

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  )
}

export function AvatarFallback({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted font-mono text-xs font-medium text-foreground uppercase',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
