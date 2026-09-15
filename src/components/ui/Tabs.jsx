import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

const TabsContext = createContext({
  activeTab: '',
  setActiveTab: () => {},
})

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }) {
  const [internalTab, setInternalTab] = useState(defaultValue)
  const activeTab = value !== undefined ? value : internalTab
  const setActiveTab = (tab) => {
    if (onValueChange) onValueChange(tab)
    else setInternalTab(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground border border-border/60',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, className, children, ...props }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3.5 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        isActive
          ? 'bg-card text-foreground shadow-sm font-semibold'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children, ...props }) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn('mt-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring', className)}
      {...props}
    >
      {children}
    </div>
  )
}
