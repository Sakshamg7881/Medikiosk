import React, { useEffect, createContext, useContext } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DialogContext = createContext({
  open: false,
  onOpenChange: () => {},
})

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false)
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onOpenChange])

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ asChild, children, ...props }) {
  const { onOpenChange } = useContext(DialogContext)
  return React.cloneElement(children, {
    onClick: (e) => {
      children.props.onClick?.(e)
      onOpenChange(true)
    },
    ...props,
  })
}

export function DialogContent({ className, children, ...props }) {
  const { open, onOpenChange } = useContext(DialogContext)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-900/60 transition-opacity backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-md transition-all text-card-foreground',
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-left mb-4', className)}
      {...props}
    />
  )
}

export function DialogTitle({ className, ...props }) {
  return (
    <h2
      className={cn('font-serif text-xl font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  )
}

export function DialogDescription({ className, ...props }) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn('mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  )
}
