import React from 'react'
import { Link } from 'react-router-dom'
import medikioskLogoImg from '@/assets/medikiosk-logo.jpg'

/**
 * Reusable MediKiosk Brand Identity Logo Component.
 * Uses the exact provided MediKiosk logo asset throughout the application.
 */
export function MediKioskLogo({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  showText = true,
  showSubtitle = false,
  subtitle = 'Clinical Intake Portal',
  className = '',
  asLink = false,
  to = '/',
}) {
  const sizeMap = {
    sm: {
      mark: 'h-7 w-7 rounded-sm',
      title: 'text-base',
      subtitle: 'text-[9px]',
      gap: 'space-x-2',
    },
    md: {
      mark: 'h-9 w-9 rounded-md',
      title: 'text-lg',
      subtitle: 'text-[11px]',
      gap: 'space-x-2.5',
    },
    lg: {
      mark: 'h-11 w-11 rounded-md',
      title: 'text-xl',
      subtitle: 'text-xs',
      gap: 'space-x-3',
    },
    xl: {
      mark: 'h-16 w-16 sm:h-20 sm:w-20 rounded-lg',
      title: 'text-2xl sm:text-3xl',
      subtitle: 'text-xs sm:text-sm',
      gap: 'space-x-4',
    },
  }

  const s = sizeMap[size] || sizeMap.md

  const content = (
    <div className={`inline-flex items-center ${s.gap} ${className}`}>
      {/* Exact MediKiosk Brand Logo Image */}
      <img
        src={medikioskLogoImg}
        alt="MediKiosk Logo"
        className={`${s.mark} object-contain shrink-0 select-none shadow-2xs`}
        draggable="false"
      />

      {/* Brand Wordmark & Subtitle */}
      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={`font-serif font-bold tracking-tight text-foreground leading-none ${s.title}`}
          >
            MediKiosk
          </span>
          {showSubtitle && (
            <span
              className={`text-muted-foreground font-sans tracking-wide mt-0.5 ${s.subtitle}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (asLink) {
    return (
      <Link
        to={to}
        className="inline-flex items-center focus:outline-none focus:ring-1 focus:ring-ring rounded-sm group transition-opacity hover:opacity-95"
      >
        {content}
      </Link>
    )
  }

  return content
}

export default MediKioskLogo
