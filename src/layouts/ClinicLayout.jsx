import React from 'react'
import { Outlet } from 'react-router-dom'

export function ClinicLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  )
}

export default ClinicLayout
