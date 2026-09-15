import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { HelpCircle, Home, Building2, FileText, FileSpreadsheet, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MediKioskLogo } from '@/components/common/MediKioskLogo'

export function PatientLayout() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/patient/login'

  const navItems = [
    { label: 'Home', path: '/patient/home', icon: Home },
    { label: 'Find Clinic', path: '/patient/clinics', icon: Building2 },
    { label: 'My Cases', path: '/patient/cases', icon: FileText },
    { label: 'Documents', path: '/patient/documents', icon: FileSpreadsheet },
    { label: 'Appointments', path: '/patient/appointments', icon: Calendar },
  ]

  const isNavVisible = !isLoginPage

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Patient Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MediKioskLogo
              size="md"
              showSubtitle={true}
              subtitle="Patient Health Portal"
              asLink={true}
              to="/patient/home"
            />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Assistance Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-foreground hover:bg-muted inline-flex items-center gap-1.5 text-xs border-border font-medium px-3 rounded-md shadow-2xs"
              onClick={() => alert('Assistance requested. A healthcare volunteer has been notified.')}
            >
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span>Help</span>
            </Button>
          </div>
        </div>

        {/* Patient Sub-Navigation Bar */}
        {isNavVisible && (
          <nav className="border-t border-border/60 bg-muted/20 px-4 sm:px-6 overflow-x-auto scrollbar-none">
            <div className="max-w-4xl mx-auto flex items-center gap-1 sm:gap-2 h-11 text-xs">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/patient/clinics' &&
                    (location.pathname.startsWith('/patient/clinic/') ||
                      location.pathname.startsWith('/patient/doctor/') ||
                      location.pathname.startsWith('/patient/consultation/')))

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors shrink-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Patient Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-start">
        <Outlet />
      </main>

      {/* Patient Footer */}
      <footer className="border-t border-border bg-card/40 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <div className="flex items-center space-x-3">
            <MediKioskLogo size="sm" showSubtitle={false} asLink={true} to="/patient/home" />
            <span className="pl-2 border-l border-border font-mono text-[11px]">
              Kiosk Terminal #04 • Offline Ready
            </span>
          </div>
          <p className="font-serif italic text-muted-foreground">
            "Your story, structured for better care."
          </p>
        </div>
      </footer>
    </div>
  )
}
export default PatientLayout
