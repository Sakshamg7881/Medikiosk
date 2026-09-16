import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Stethoscope,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  FileText,
  User,
  Inbox,
  Filter,
  Calendar,
  Check,
  CalendarDays,
} from 'lucide-react'
import { getDoctorCases } from '@/lib/api'
import { updateAppointmentStatus } from '@/lib/appointments'
import { getDoctorSession, getDoctorScopedCases, getDoctorScopedAppointments } from '@/lib/doctorAuth'

export function DoctorDashboard() {
  const doctor = getDoctorSession()
  const [cases, setCases] = useState([])
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL') // ALL, PENDING, REVIEWED, RED_FLAG
  const [completingApptId, setCompletingApptId] = useState(null)

  const doctorId = doctor ? (doctor.doctorId || doctor.id) : 1

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let casesData = await getDoctorScopedCases(doctorId)
      if (!casesData || casesData.length === 0) {
        // Fallback to queue if doctor is associated with demo clinic
        casesData = await getDoctorCases().catch(() => [])
      }

      let apptsData = await getDoctorScopedAppointments(doctorId)
      if (!apptsData || apptsData.length === 0) {
        apptsData = []
      }

      setCases(casesData || [])
      setAppointments(apptsData || [])
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err)
      setError(err.message || 'Unable to load clinical workspace data.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteConsultation = async (apptId) => {
    setCompletingApptId(apptId)
    try {
      await updateAppointmentStatus(apptId, 'COMPLETED')
      const updatedAppts = await getDoctorScopedAppointments(doctorId)
      setAppointments(updatedAppts || [])
    } catch (err) {
      console.error('Failed to mark appointment completed:', err)
    } finally {
      setCompletingApptId(null)
    }
  }

  // Statistics
  const totalCount = cases.length
  const pendingCount = cases.filter((c) => c.status !== 'REVIEWED' && c.status !== 'COMPLETED').length
  const reviewedCount = cases.filter((c) => c.status === 'REVIEWED').length
  const redFlagCount = cases.filter((c) => c.redFlagDetected).length

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    if (filter === 'PENDING') return c.status !== 'REVIEWED' && c.status !== 'COMPLETED'
    if (filter === 'REVIEWED') return c.status === 'REVIEWED'
    if (filter === 'RED_FLAG') return c.redFlagDetected
    return true
  })

  // Filtered upcoming appointments
  const upcomingAppointments = appointments.filter((a) => a.status !== 'COMPLETED')
  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED')

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full pb-16">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Badge variant="accent">OPD Clinical Workspace</Badge>
            <span className="font-mono text-xs text-muted-foreground">
              {doctor?.clinicName || 'MediKiosk Case Review'}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Doctor Consultation Queue
          </h1>
          <p className="text-muted-foreground text-sm">
            {doctor ? `${doctor.name || doctor.doctorName} • ${doctor.speciality || 'AYUSH'}` : 'Triage, clinical history, AYUSH indicators, and case sign-off.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Workspace</span>
          </Button>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            filter === 'ALL'
              ? 'border-primary bg-primary/10 ring-1 ring-primary'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="font-mono text-xs text-muted-foreground">Total Cases</div>
          <div className="font-serif text-2xl font-bold text-foreground mt-0.5">{totalCount}</div>
        </button>

        <button
          onClick={() => setFilter('PENDING')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            filter === 'PENDING'
              ? 'border-primary bg-primary/10 ring-1 ring-primary'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Review</span>
          </div>
          <div className="font-serif text-2xl font-bold text-foreground mt-0.5">{pendingCount}</div>
        </button>

        <button
          onClick={() => setFilter('RED_FLAG')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            filter === 'RED_FLAG'
              ? 'border-destructive bg-destructive/10 ring-1 ring-destructive'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="font-mono text-xs text-destructive font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Red Flag Cases</span>
          </div>
          <div className="font-serif text-2xl font-bold text-destructive mt-0.5">{redFlagCount}</div>
        </button>

        <button
          onClick={() => setFilter('REVIEWED')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            filter === 'REVIEWED'
              ? 'border-secondary bg-secondary/15 ring-1 ring-secondary'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="font-mono text-xs text-secondary font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Reviewed</span>
          </div>
          <div className="font-serif text-2xl font-bold text-foreground mt-0.5">{reviewedCount}</div>
        </button>
      </div>

      {/* SECTION 1: UPCOMING SCHEDULED CONSULTATIONS */}
      <Card className="border-2 border-primary/30 shadow-xs overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-border bg-primary/5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Upcoming Consultations ({upcomingAppointments.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Confirmed patient consultation appointments linked to MediKiosk prepared cases.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            {completedAppointments.length} Completed Today
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {upcomingAppointments.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-muted-foreground text-xs">
              <Calendar className="h-7 w-7 mx-auto text-muted-foreground/40" />
              <p>No upcoming booked consultations at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {upcomingAppointments.map((appt) => {
                const linkedCase = cases.find((c) => c.caseId === appt.caseId)
                const isCaseReviewed = linkedCase ? linkedCase.status === 'REVIEWED' : false
                const hasRedFlag = linkedCase ? (linkedCase.redFlagDetected || linkedCase.redFlagTerms?.length > 0) : false
                const isSubmitting = completingApptId === appt.id

                return (
                  <div
                    key={appt.id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      hasRedFlag ? 'bg-destructive/5' : 'bg-card hover:bg-muted/20'
                    }`}
                  >
                    {/* Left: Token, Patient & Slot info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                          {appt.consultationToken || `TK-${String(appt.caseId || '04').padStart(2, '0')}`}
                        </span>

                        <span className="font-serif text-base font-bold text-foreground">
                          {appt.patientName}
                        </span>

                        <Badge variant="outline" className="text-[10px] font-mono">
                          {appt.consultationType || 'First Consultation'}
                        </Badge>

                        {/* Case readiness status */}
                        {isCaseReviewed ? (
                          <Badge variant="success" className="text-[10px] py-0 px-2">
                            Case Reviewed
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px] py-0 px-2">
                            Case Intake Ready
                          </Badge>
                        )}

                        {hasRedFlag && (
                          <Badge variant="destructive" className="text-[10px] py-0 px-2 font-bold animate-pulse flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Red Flag</span>
                          </Badge>
                        )}
                      </div>

                      {/* Scheduled slot and clinic */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1 text-foreground font-semibold">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span>{appt.date} • {appt.time}</span>
                        </span>
                        <span>•</span>
                        <span>{appt.clinicName || 'Ayush Arogya Kendra'}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">
                          Case #{appt.caseId}
                        </span>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Open Case Review */}
                      <Link to={`/doctor/case/${appt.caseId}`}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-medium">
                          <Stethoscope className="h-3.5 w-3.5" />
                          <span>Open Clinical Case</span>
                        </Button>
                      </Link>

                      {/* Mark Completed */}
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isSubmitting}
                        onClick={() => handleCompleteConsultation(appt.id)}
                        className="gap-1.5 text-xs font-medium"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>Mark Completed</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: PATIENT CASE QUEUE */}
      <Card className="border-border">
        <CardHeader className="py-4 px-5 border-b border-border/70 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Patient Case Queue ({filteredCases.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Patients who completed MediKiosk kiosk intake and are waiting for clinical consultation.
            </CardDescription>
          </div>
          {filter !== 'ALL' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter('ALL')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear Filter
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Fetching patient cases...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchDashboardData}>
                Retry
              </Button>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Inbox className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <h3 className="font-serif text-base font-semibold text-foreground">No cases in queue</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {filter === 'ALL'
                  ? 'No patient cases have been registered today yet. Complete a patient intake from the kiosk to see it appear here.'
                  : `No cases matching the current "${filter.toLowerCase()}" filter.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCases.map((c) => {
                const isItemReviewed = c.status === 'REVIEWED'
                const hasRedFlag = c.redFlagDetected || (c.redFlagTerms && c.redFlagTerms.length > 0)

                return (
                  <div
                    key={c.caseId}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      hasRedFlag
                        ? 'bg-destructive/5 hover:bg-destructive/10'
                        : isItemReviewed
                        ? 'bg-card/40 hover:bg-card'
                        : 'bg-card hover:bg-muted/30'
                    }`}
                  >
                    {/* Left details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Token / ID */}
                        <span className="font-mono text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                          #{c.caseId}
                        </span>

                        {/* Patient Name */}
                        <span className="font-serif text-base font-bold text-foreground">
                          {c.patientName}
                        </span>

                        {/* Demographics */}
                        <span className="text-xs text-muted-foreground font-mono">
                          {c.patientAge ? `${c.patientAge}y` : ''}
                          {c.patientGender ? ` • ${c.patientGender}` : ''}
                          {c.preferredLanguage ? ` • Lang: ${c.preferredLanguage.toUpperCase()}` : ''}
                        </span>

                        {/* Status Badge */}
                        {isItemReviewed ? (
                          <Badge variant="success" className="text-[10px] py-0 px-2">
                            REVIEWED
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px] py-0 px-2">
                            READY_FOR_REVIEW
                          </Badge>
                        )}

                        {/* Red Flag Warning Badge */}
                        {hasRedFlag && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] py-0 px-2 font-bold flex items-center gap-1 animate-pulse"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            <span>RED FLAG</span>
                          </Badge>
                        )}
                      </div>

                      {/* Chief Complaint */}
                      <p className="text-sm text-foreground/90 font-medium line-clamp-1">
                        {c.chiefComplaint}
                      </p>

                      {/* Meta information */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                        {hasRedFlag && c.redFlagTerms && c.redFlagTerms.length > 0 && (
                          <span className="text-destructive font-mono font-semibold text-[11px]">
                            ⚠️ {c.redFlagTerms.join(', ')}
                          </span>
                        )}

                        {c.documentCount > 0 && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <FileText className="h-3 w-3 text-primary" />
                            <span>{c.documentCount} Document{c.documentCount > 1 ? 's' : ''}</span>
                          </span>
                        )}

                        {c.doctorReviewedAt && (
                          <span className="font-mono text-[11px] text-secondary font-medium">
                            Reviewed at {new Date(c.doctorReviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Action */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link to={`/doctor/case/${c.caseId}`}>
                        <Button
                          size="sm"
                          variant={hasRedFlag ? 'destructive' : isItemReviewed ? 'outline' : 'default'}
                          className="gap-1.5 font-medium"
                        >
                          <Stethoscope className="h-3.5 w-3.5" />
                          <span>{isItemReviewed ? 'View / Edit Review' : 'Review Case'}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
export default DoctorDashboard
