import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Heart, Stethoscope } from 'lucide-react'
import medikioskLogoImg from '@/assets/medikiosk-logo.jpg'

// Module-level tracking of document lifecycle
const initialPath = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : ''
const isRootPageLoad = initialPath === '' || initialPath === '/'

let hasCompletedInitialSplash = !isRootPageLoad

/**
 * MediKiosk Welcome Animation (Plays ONLY on Full Browser Page Load / Refresh of Home)
 *
 * Sequence (~2.7s total):
 * 1. 0.0s - 0.7s: Logo fade-in & scale up
 * 2. 0.7s - 1.4s: "Welcome to MediKiosk" slides up from below
 * 3. 1.3s - 2.0s: "Your story, structured for better care." tagline appears
 * 4. 1.8s - 2.4s: Staggered icons (Leaf, Heart, Stethoscope) slide/fade in
 * 5. 2.2s - 2.7s: "Starting your journey..." with sleek progress bar
 * 6. Smooth exit into the page
 */
export function IntroSplash({ onComplete }) {
  const [isVisible, setIsVisible] = useState(() => {
    if (hasCompletedInitialSplash) return false
    return isRootPageLoad
  })

  useEffect(() => {
    if (!isVisible) return

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const totalDuration = prefersReducedMotion ? 600 : 2700

    const timer = setTimeout(() => {
      hasCompletedInitialSplash = true
      setIsVisible(false)
      if (onComplete) onComplete()
    }, totalDuration)

    return () => clearTimeout(timer)
  }, [isVisible, onComplete])

  const handleSkip = () => {
    hasCompletedInitialSplash = true
    setIsVisible(false)
    if (onComplete) onComplete()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="medikiosk-welcome-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeInOut' } }}
          onClick={handleSkip}
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to MediKiosk"
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden px-4"
        >
          {/* Subtle Ambient Background Radials */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[#EAF3FF]/40 via-[#FAF9F6]/50 to-transparent rounded-full blur-3xl opacity-70" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-[#EBF5F1]/50 to-transparent rounded-full blur-2xl opacity-60" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-5">
            {/* 1. Logo: Scale + Fade (0.0s - 0.8s) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-[#CCDCD5]/80 shadow-[0_8px_24px_rgba(23,32,51,0.06)] p-2.5 flex items-center justify-center">
                <img
                  src={medikioskLogoImg}
                  alt="MediKiosk Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <span className="font-serif text-xs uppercase tracking-[0.25em] text-[#2F7663] font-semibold mt-3">
                MediKiosk
              </span>
            </motion.div>

            {/* 2. Welcome Headline: Slides up from below (0.8s - 1.6s) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1"
            >
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">
                Welcome to <span className="text-[#2F7663]">MediKiosk</span>
              </h1>
            </motion.div>

            {/* 3. Tagline: Text reveal (1.3s - 2.2s) */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3, ease: 'easeOut' }}
              className="text-sm sm:text-base text-[#5F6670] max-w-xs sm:max-w-sm leading-relaxed"
            >
              Your story, structured for{' '}
              <span className="text-[#2F7663] font-semibold">better care.</span>
            </motion.p>

            {/* 4. Three Staggered Brand Feature Icons (1.8s - 2.6s) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.3 }}
              className="flex items-center justify-center gap-3 pt-2"
            >
              {/* Icon 1: Leaf */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.85, duration: 0.4, ease: 'easeOut' }}
                className="w-10 h-10 rounded-full bg-[#EBF5F1] text-[#2F7663] flex items-center justify-center shadow-2xs border border-[#CCDCD5]/50"
                title="AYUSH & Holistic Health"
              >
                <Leaf className="h-4 w-4" />
              </motion.div>

              {/* Icon 2: Heart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 2.0, duration: 0.4, ease: 'easeOut' }}
                className="w-10 h-10 rounded-full bg-[#FFF0E7] text-[#D98A52] flex items-center justify-center shadow-2xs border border-[#CCDCD5]/50"
                title="Personal Health Story"
              >
                <Heart className="h-4 w-4" />
              </motion.div>

              {/* Icon 3: Stethoscope */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 2.15, duration: 0.4, ease: 'easeOut' }}
                className="w-10 h-10 rounded-full bg-[#F0ECFF] text-[#6366F1] flex items-center justify-center shadow-2xs border border-[#CCDCD5]/50"
                title="Clinical Excellence"
              >
                <Stethoscope className="h-4 w-4" />
              </motion.div>
            </motion.div>

            {/* 5. Progress Indicator & Journey Text (2.4s - 3.2s) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.3, duration: 0.4 }}
              className="pt-4 flex flex-col items-center space-y-2 w-48"
            >
              <span className="text-[11px] font-medium text-[#5F6670] tracking-wide">
                Starting your journey...
              </span>
              <div className="w-full h-1 bg-[#E5E9E6] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 2.35, duration: 0.85, ease: 'easeInOut' }}
                  className="h-full bg-[#2F7663] rounded-full"
                />
              </div>
            </motion.div>
          </div>

          {/* Skip prompt in bottom corner */}
          <div className="absolute bottom-6 text-[11px] text-[#5F6670]/60 hover:text-[#2F7663] transition-colors">
            Click anywhere to skip
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
export default IntroSplash
