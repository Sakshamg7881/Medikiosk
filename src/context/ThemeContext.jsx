import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
})

const STORAGE_KEY = 'medikiosk-theme'

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'light')
      return 'light'
    } catch {
      return 'light'
    }
  })

  // Permanent Light/Day mode enforcement
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
    document.body?.classList.remove('dark')
    try {
      localStorage.setItem(STORAGE_KEY, 'light')
    } catch {}
  }, [])

  const setTheme = () => {}
  const toggleTheme = () => {}

  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
