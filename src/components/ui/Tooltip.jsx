import React, { useState } from 'react'
import { cn } from '@/lib/utils'

export function Tooltip({ text, children, position = 'top', className }) {
  const [visible, setVisible] = useState(false)

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }

  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-sm bg-ink-800 dark:bg-card px-2.5 py-1 font-mono text-xs text-parchment-100 dark:text-foreground shadow-md border border-border/40',
            positions[position] || positions.top
          )}
        >
          {text}
        </div>
      )}
    </div>
  )
}
