import React, { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Stethoscope, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediKioskLogo } from '@/components/common/MediKioskLogo'
import { getDoctorSession, logoutDoctor } from '@/lib/doctorAuth'

export function DoctorLayout() {
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)

  useEffect(() => {
    const session = getDoctorSession()
    if (!session) {
      navigate('/provider/login/doctor', { replace: true })
      return
    }
    setDoctor(session)
  }, [navigate])

  const handleLogout = () => {
    logoutDoctor()
    navigate('/provider/login', { replace: true })
  }

  if (!doctor) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Doctor Header: Purpose-built for fast clinical review */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <MediKioskLogo
              size="md"
              showSubtitle={true}
              subtitle="Doctor Consultation"
              asLink={true}
              to="/doctor/dashboard"
            />

            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-border text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-secondary inline-block"></span>
              <span className="font-mono">{doctor.clinicName || 'AYUSH Health Kendra'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs font-mono bg-muted/60 px-3 py-1.5 rounded-sm border border-border">
              <Stethoscope className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold">{doctor.name || doctor.doctorName}</span>
              <span className="text-muted-foreground hidden sm:inline">({doctor.speciality || 'AYUSH'})</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              title="Logout from Doctor Workspace"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Clinical Consultation Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* Clinical Workspace Footer */}
      <footer className="border-t border-border bg-card/40 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <div className="flex items-center space-x-3">
            <MediKioskLogo size="sm" showSubtitle={false} asLink={true} to="/doctor/dashboard" />
            <span className="pl-2 border-l border-border font-mono text-[11px]">
              {doctor.name || doctor.doctorName} • {doctor.clinicName || 'Clinic Consultation Desk'}
            </span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
            <span>Active Doctor Session</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
