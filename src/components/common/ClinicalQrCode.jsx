import React from 'react'

/**
 * Authentic Square Clinical QR Code Component
 * Renders a crisp vector QR with proper quiet zone, three position detection squares,
 * timing patterns, and data matrix blocks. No futuristic decorations or AI artifacts.
 */
export function ClinicalQrCode({ value = 'MK-CASE-004', size = 160, className = '' }) {
  // Deterministic pattern generation based on input string
  const hashString = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash)
  }

  const seed = hashString(value)
  const matrixSize = 25 // 25x25 standard QR grid

  // Helper to check if a cell is in finder pattern (top-left, top-right, bottom-left 7x7)
  const isFinder = (r, c) => {
    if (r < 7 && c < 7) return true // Top-left
    if (r < 7 && c >= matrixSize - 7) return true // Top-right
    if (r >= matrixSize - 7 && c < 7) return true // Bottom-left
    return false
  }

  // Draw finder pattern squares
  const renderFinder = (startR, startC) => {
    return (
      <g key={`finder-${startR}-${startC}`}>
        {/* Outer 7x7 black box */}
        <rect x={startC} y={startR} width={7} height={7} fill="currentColor" />
        {/* Inner 5x5 white box */}
        <rect x={startC + 1} y={startR + 1} width={5} height={5} fill="#FFFFFF" />
        {/* Center 3x3 black box */}
        <rect x={startC + 2} y={startR + 2} width={3} height={3} fill="currentColor" />
      </g>
    )
  }

  // Generate data modules deterministically
  const modules = []
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinder(r, c)) continue

      // Timing patterns (row 6 and col 6)
      if (r === 6 || c === 6) {
        if ((r + c) % 2 === 0) {
          modules.push(<rect key={`m-${r}-${c}`} x={c} y={r} width={1} height={1} fill="currentColor" />)
        }
        continue
      }

      // Pseudo-random pseudo-data based on seed
      const pseudoVal = (seed * (r * 31 + c * 17) + r * 13 + c) % 100
      if (pseudoVal > 48) {
        modules.push(<rect key={`m-${r}-${c}`} x={c} y={r} width={1} height={1} fill="currentColor" />)
      }
    }
  }

  return (
    <div
      className={`inline-block p-3 bg-white rounded-md border border-border shadow-xs ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        viewBox={`0 0 ${matrixSize} ${matrixSize}`}
        width={size}
        height={size}
        className="text-neutral-900"
        shapeRendering="crispEdges"
      >
        {/* Top-left Finder */}
        {renderFinder(0, 0)}
        {/* Top-right Finder */}
        {renderFinder(0, matrixSize - 7)}
        {/* Bottom-left Finder */}
        {renderFinder(matrixSize - 7, 0)}

        {/* Data modules */}
        {modules}
      </svg>
    </div>
  )
}

export default ClinicalQrCode
