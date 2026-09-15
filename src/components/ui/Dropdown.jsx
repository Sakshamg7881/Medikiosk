import React, { useState, useRef, useEffect, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

const DropdownContext = createContext({
  isOpen: false,
  setIsOpen: () => {},
})

export function Dropdown({ children, className }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownTrigger({ children, asChild, className, ...props }) {
  const { isOpen, setIsOpen } = useContext(DropdownContext)

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className={cn('inline-flex cursor-pointer select-none', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownContent({
  align = 'right',
  className,
  children,
  ...props
}) {
  const { isOpen, setIsOpen } = useContext(DropdownContext)

  if (!isOpen) return null

  const alignmentClass =
    align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'

  return (
    <div
      className={cn(
        'absolute z-50 mt-1 min-w-[12rem] rounded-md border border-border bg-card p-1 shadow-md text-foreground focus:outline-none animate-in fade-in-50 zoom-in-95',
        alignmentClass,
        className
      )}
      onClick={() => setIsOpen(false)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownItem({
  className,
  disabled = false,
  children,
  onClick,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-sm px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:outline-none disabled:pointer-events-none disabled:opacity-50 text-left cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function DropdownSeparator({ className, ...props }) {
  return (
    <div
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}
