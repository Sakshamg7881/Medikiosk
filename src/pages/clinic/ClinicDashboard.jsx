import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  FileText,
  Calendar,
  Settings,
  Plus,
  LogOut,
  Clock,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  ShieldCheck,
  Save,
  Check,
  AlertTriangle,
  CreditCard,
  Sparkles
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { MediKioskLogo } from '@/components/common/MediKioskLogo'
import {
  getClinicSession,
  logoutClinic,
  updateClinicProfile,
  getClinicDoctors,
  addClinicDoctor,
  getClinicScopedCases,
  getClinicAppointments
} from '@/lib/clinicAuth'
import { getAllAppointments } from '@/lib/appointments'

export function ClinicDashboard() {
  const navigate = useNavigate()
  const [clinic, setClinic] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Scoped Data States
  const [doctors, setDoctors] = useState([])
  const [cases, setCases] = useState([])
  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Add Doctor Modal State
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    phone: '',
    password: 'doc123',
    qualification: 'BAMS, MD (Ayurveda)',
    ayushSystem: 'Ayurveda',
    specialization: 'General AYUSH Consultation',
    consultationFee: '500',
    experience: '5 Years Experience',
    availableDays: 'Mon - Sat (10:00 AM - 04:00 PM)',
  })
  const [doctorSuccessBanner, setDoctorSuccessBanner] = useState(null)

  // Edit Profile State
  const [profileForm, setProfileForm] = useState({
    name: '',
    adminName: '',
    email: '',
    address: '',
    city: '',
    ayushSpecialization: '',
  })
  const [profileSaved, setProfileSaved] = useState(false)

  // Auth Guard & Initial Load
  useEffect(() => {
    const session = getClinicSession()
    if (!session) {
      navigate('/clinic/login', { replace: true })
      return
    }

    setClinic(session)
    setProfileForm({
      name: session.name || session.clinicName || '',
      adminName: session.adminName || session.ownerName || '',
      email: session.email || '',
      address: session.address || '',
      city: session.city || '',
      ayushSpecialization: session.ayushSpecialization || 'Ayurveda',
    })

    loadClinicData(session.id)
  }, [navigate])

  const loadClinicData = async (clinicId) => {
    setIsLoading(true)

    // 1. Doctors strictly scoped to this clinicId
    const docs = await getClinicDoctors(clinicId)
    setDoctors(docs || [])

    // 2. Fetch appointments strictly filtered to this clinicId
    const clinicAppts = await getClinicAppointments(clinicId)
    setAppointments(clinicAppts || [])

    // 3. Fetch cases strictly filtered to this clinic
    const scopedCases = await getClinicScopedCases(clinicId)
    setCases(scopedCases || [])

    setIsLoading(false)
  }

  const handleLogout = () => {
    logoutClinic()
    navigate('/provider/login', { replace: true })
  }

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault()
    if (!newDoctor.name.trim() || !clinic) return

    const added = await addClinicDoctor(clinic.id, {
      ...newDoctor,
      clinicName: clinic.name || clinic.clinicName,
    })

    if (added) {
      setDoctors(prev => [added, ...prev])
      setIsAddDoctorOpen(false)
      setDoctorSuccessBanner({
        name: added.name,
        phone: added.phone || newDoctor.phone,
        password: added.password || newDoctor.password,
      })
      setNewDoctor({
        name: '',
        phone: '',
        password: 'doc' + Math.floor(100 + Math.random() * 900),
        qualification: 'BAMS, MD (Ayurveda)',
        ayushSystem: 'Ayurveda',
        specialization: 'General AYUSH Consultation',
        consultationFee: '500',
        experience: '5 Years Experience',
        availableDays: 'Mon - Sat (10:00 AM - 04:00 PM)',
      })
    }
  }

  const handleProfileSave = (e) => {
    e.preventDefault()
    if (!clinic) return

    const updated = {
      ...clinic,
      name: profileForm.name.trim() || clinic.name,
      adminName: profileForm.adminName.trim() || clinic.adminName,
      email: profileForm.email.trim(),
      address: profileForm.address.trim(),
      city: profileForm.city.trim(),
      ayushSpecialization: profileForm.ayushSpecialization,
    }

    const ok = updateClinicProfile(updated)
    if (ok) {
      setClinic(updated)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    }
  }

  if (!clinic) return null

  // Metric counts
  const pendingCasesCount = cases.filter(c => c.status !== 'COMPLETED' && c.status !== 'DOCTOR_REVIEWED').length
  const upcomingApptsCount = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'REQUESTED').length

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Clinic Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MediKioskLogo
              size="md"
              showSubtitle={true}
              subtitle="Clinic Dashboard"
              asLink={false}
            />
            <div className="hidden sm:flex items-center pl-3 border-l border-border space-x-2">
              <Badge variant="outline" className="text-xs font-medium">
                {clinic.name}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {clinic.city || 'Facility'}
              </Badge>
              <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                {clinic.subscriptionPlan || clinic.plan || 'Professional'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded border border-border">
              <Phone className="h-3 w-3 text-primary" />
              <span>{clinic.formattedPhone || clinic.phone}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground border-border"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Dashboard Navigation Bar */}
        <div className="border-t border-border bg-card/60 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-1">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'doctors', label: `Doctors (${doctors.length})`, icon: Users },
              { id: 'cases', label: `Patients / Cases (${cases.length})`, icon: FileText },
              { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
              { id: 'profile', label: 'Clinic Profile', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ---------------------------------------------------- */}
        {/* TAB 1: OVERVIEW */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Facility Banner (Private Info Display) */}
            <div className="p-4 sm:p-6 rounded-lg bg-card border border-border shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                      {clinic.name}
                    </h1>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Private Facility
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                      {clinic.subscriptionPlan || clinic.plan || 'Professional'} Plan
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {clinic.subscriptionStatus || 'Active (Demo)'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Administered by <strong className="text-foreground">{clinic.adminName || 'Facility Staff'}</strong> • {clinic.ayushSpecialization}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('profile')}
                  className="gap-1.5 text-xs self-start sm:self-center"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Edit Facility Details</span>
                </Button>
              </div>

              {/* Clinic Quick Details Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Phone ID: <strong className="font-mono text-foreground">{clinic.formattedPhone || clinic.phone}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">Email: <strong className="text-foreground">{clinic.email || 'Not configured'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">Location: <strong className="text-foreground">{clinic.address ? `${clinic.address}, ${clinic.city}` : clinic.city || 'Delhi'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">Plan: <strong className="text-foreground">{clinic.subscriptionPlan || clinic.plan || 'Professional'}</strong> (<span className="text-emerald-600 font-medium">Demo Active</span>)</span>
                </div>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-4 flex flex-col justify-between border-border">
                <span className="font-mono text-[11px] text-muted-foreground uppercase">Total Doctors</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-3xl font-bold text-foreground">{doctors.length}</span>
                  <Users className="h-5 w-5 text-primary/40" />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">Affiliated practitioners</span>
              </Card>

              <Card className="p-4 flex flex-col justify-between border-border">
                <span className="font-mono text-[11px] text-muted-foreground uppercase">Patients / Cases</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-3xl font-bold text-foreground">{cases.length}</span>
                  <FileText className="h-5 w-5 text-secondary/40" />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">Intake records registered</span>
              </Card>

              <Card className="p-4 flex flex-col justify-between border-border">
                <span className="font-mono text-[11px] text-muted-foreground uppercase">Pending Cases</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-3xl font-bold text-accent">{pendingCasesCount}</span>
                  <Clock className="h-5 w-5 text-accent/40" />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">Awaiting physician review</span>
              </Card>

              <Card className="p-4 flex flex-col justify-between border-border">
                <span className="font-mono text-[11px] text-muted-foreground uppercase">Appointments</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-serif text-3xl font-bold text-foreground">{upcomingApptsCount}</span>
                  <Calendar className="h-5 w-5 text-primary/40" />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">Upcoming OPD visits</span>
              </Card>
            </div>

            {/* Recent Cases & Quick Doctors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Patient Queue Card */}
              <Card className="border-border">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-serif font-bold">Active Patient Intake Queue</CardTitle>
                    <CardDescription className="text-xs">Live status of kiosk consultations</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('cases')} className="text-xs">
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {cases.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No patient intake cases recorded for this clinic yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border rounded-md border border-border">
                      {cases.slice(0, 4).map((c) => (
                        <div key={c.id} className="p-3 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{c.patientName || `Patient #${c.patientId || c.id}`}</span>
                              {c.redFlagDetected && (
                                <Badge variant="destructive" className="text-[9px] px-1 py-0">
                                  Red Flag
                                </Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground truncate max-w-xs">
                              {c.chiefComplaint || 'Health intake in progress'}
                            </div>
                          </div>
                          <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                            {c.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Clinic Doctors Card */}
              <Card className="border-border">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-serif font-bold">Attending Doctors</CardTitle>
                    <CardDescription className="text-xs">Practitioners attached to this facility</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsAddDoctorOpen(true)} className="gap-1 text-xs">
                    <Plus className="h-3 w-3" />
                    <span>Add Doctor</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  {doctors.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No doctors added to this clinic yet. Click "Add Doctor" to onboard.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {doctors.slice(0, 4).map((d) => (
                        <div key={d.id} className="p-2.5 rounded-md border border-border flex items-center justify-between text-xs bg-muted/20">
                          <div>
                            <div className="font-semibold text-foreground">{d.name}</div>
                            <div className="text-[11px] text-muted-foreground">{d.qualification} • {d.specialization}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-primary font-semibold">₹{d.consultationFee}</span>
                            <div className="text-[10px] text-muted-foreground">{d.availableDays || 'Available'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: DOCTORS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">Clinic Medical Staff</h2>
                <p className="text-xs text-muted-foreground">
                  Manage attending AYUSH physicians, credentials, consultation fees, and schedules for {clinic.name || clinic.clinicName}.
                </p>
              </div>
              <Button onClick={() => setIsAddDoctorOpen(true)} className="gap-1.5 font-semibold text-xs self-start sm:self-center">
                <Plus className="h-4 w-4" />
                <span>Add Doctor</span>
              </Button>
            </div>

            {doctorSuccessBanner && (
              <div className="p-3.5 rounded-md bg-secondary/15 border border-secondary/30 text-xs text-foreground flex items-start justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-secondary shrink-0" />
                  <div>
                    <span className="font-semibold text-secondary">Doctor Account Created!</span>{' '}
                    <span>{doctorSuccessBanner.name} can now log in at <strong>/provider/login/doctor</strong> using Phone: <strong className="font-mono bg-background/80 px-1.5 py-0.5 rounded border">{doctorSuccessBanner.phone}</strong> and Password: <strong className="font-mono bg-background/80 px-1.5 py-0.5 rounded border">{doctorSuccessBanner.password}</strong></span>
                  </div>
                </div>
                <button onClick={() => setDoctorSuccessBanner(null)} className="text-muted-foreground hover:text-foreground text-xs font-semibold">✕</button>
              </div>
            )}

            {doctors.length === 0 ? (
              <Card className="p-8 text-center border-border space-y-3">
                <Stethoscope className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="font-serif font-bold text-base">No Doctors Added Yet</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Add doctors to your clinic profile so patients can be booked for physician reviews and consultations.
                </p>
                <Button size="sm" onClick={() => setIsAddDoctorOpen(true)} className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add First Doctor</span>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doc) => (
                  <Card key={doc.id} className="p-4 border-border space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-serif font-bold text-base text-foreground">{doc.name}</div>
                        <div className="text-xs font-mono text-primary font-medium">{doc.qualification || 'BAMS, MD'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{doc.speciality || doc.specialization}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-1">
                          Phone: {doc.phone || doc.contact || 'Registered'}
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        Active
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border font-sans">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">System:</span>
                        <strong className="text-foreground">{doc.ayushSystem || 'Ayurveda'}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Fee:</span>
                        <strong className="font-mono text-primary">₹{doc.consultationFee}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Schedule:</span>
                        <span className="text-foreground">{doc.availableDays || 'Mon - Sat'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Experience:</span>
                        <span className="text-foreground">{doc.experience || '5+ Years'}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: PATIENTS / CASES */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'cases' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Clinic Patient Cases</h2>
              <p className="text-xs text-muted-foreground">
                Intake records captured at this clinic facility. Data is strictly isolated to your clinic account.
              </p>
            </div>

            {cases.length === 0 ? (
              <Card className="p-8 text-center border-border space-y-2">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="font-serif font-bold text-base">No Patient Cases Registered</h3>
                <p className="text-xs text-muted-foreground">
                  Patient cases will appear here as visitors complete their health intake on MediKiosk terminals.
                </p>
              </Card>
            ) : (
              <Card className="border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-mono">
                      <tr>
                        <th className="p-3">Case ID</th>
                        <th className="p-3">Patient Name</th>
                        <th className="p-3">Chief Complaint</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Triage</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-sans">
                      {cases.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-mono font-semibold text-primary">#{c.id}</td>
                          <td className="p-3 font-medium text-foreground">
                            {c.patientName || `Patient #${c.patientId || c.id}`}
                          </td>
                          <td className="p-3 text-muted-foreground max-w-xs truncate">
                            {c.chiefComplaint || 'Consultation Intake'}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {c.status || 'READY_FOR_REVIEW'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {c.redFlagDetected ? (
                              <Badge variant="destructive" className="gap-1 text-[10px]">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Red Flag</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Routine
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Link to={`/doctor/case/${c.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                View Case
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: APPOINTMENTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Consultation Appointments</h2>
              <p className="text-xs text-muted-foreground">
                Upcoming and completed doctor consultations booked for {clinic.name}.
              </p>
            </div>

            {appointments.length === 0 ? (
              <Card className="p-8 text-center border-border space-y-2">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="font-serif font-bold text-base">No Appointments Recorded</h3>
                <p className="text-xs text-muted-foreground">
                  Patient appointments booked for your clinic doctors will display here in real-time.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appt) => (
                  <Card key={appt.id} className="p-4 border-border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-primary font-bold">
                        {appt.consultationToken || `TK-#${appt.id}`}
                      </Badge>
                      <Badge variant={appt.status === 'COMPLETED' ? 'secondary' : 'default'} className="text-[10px]">
                        {appt.status}
                      </Badge>
                    </div>

                    <div>
                      <div className="font-serif font-bold text-sm text-foreground">{appt.patientName}</div>
                      <div className="text-xs text-muted-foreground">Doctor: {appt.doctorName}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border font-mono text-muted-foreground">
                      <span>Date: {appt.date}</span>
                      <span>Time: {appt.time}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 5: CLINIC PROFILE */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Clinic Profile Settings</h2>
              <p className="text-xs text-muted-foreground">
                Manage your facility contact details, address, and primary AYUSH clinical speciality.
              </p>
            </div>

            <Card className="border-border">
              <form onSubmit={handleProfileSave}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-serif font-bold">Facility Information</CardTitle>
                  <CardDescription className="text-xs">
                    Information shown on patient appointment passes and clinical hand-off sheets.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {profileSaved && (
                    <div className="p-3 rounded-md bg-secondary/15 border border-secondary/30 text-secondary text-xs flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Clinic profile updated successfully.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Clinic Name</label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Administrator Name</label>
                      <Input
                        value={profileForm.adminName}
                        onChange={(e) => setProfileForm({ ...profileForm, adminName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Phone Number (Login ID)</label>
                      <Input
                        value={clinic.formattedPhone || clinic.phone}
                        disabled
                        className="font-mono bg-muted/40 cursor-not-allowed"
                      />
                      <span className="text-[10px] text-muted-foreground">Phone number cannot be changed.</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Email Address</label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Address</label>
                      <Input
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">City</label>
                      <Input
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Speciality</label>
                    <Input
                      value={profileForm.ayushSpecialization}
                      onChange={(e) => setProfileForm({ ...profileForm, ayushSpecialization: e.target.value })}
                    />
                  </div>
                </CardContent>

                <CardFooter className="pt-2 flex justify-end">
                  <Button type="submit" className="gap-2 font-semibold">
                    <Save className="h-4 w-4" />
                    <span>Save Profile Changes</span>
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Subscription & Plan Status Card */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-serif font-bold">Subscription & Plan</CardTitle>
                      <CardDescription className="text-xs">
                        Current active tier and billing details for this healthcare facility.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
                    {clinic.subscriptionStatus || 'Active (Demo)'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-muted/40 border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Current Plan</span>
                    <div className="font-serif font-bold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>{clinic.subscriptionPlan || clinic.plan || 'Professional'} Tier</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Billing Model</span>
                    <div className="font-semibold text-foreground text-xs mt-1">
                      Monthly (Demo Active)
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Renewal Date</span>
                    <div className="font-mono text-foreground text-xs mt-1">
                      {clinic.subscriptionEndDate || 'Valid for 30 Days'}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
                  <div className="font-semibold text-foreground text-xs">Tier Capacity & Features</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground text-xs">
                    {(clinic.subscriptionPlan?.toLowerCase() === 'starter' || clinic.plan?.toLowerCase() === 'starter') ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Up to 2 Doctor Accounts</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>100 Patient Records / mo</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Standard AYUSH Triage</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Email Support</span>
                        </div>
                      </>
                    ) : (clinic.subscriptionPlan?.toLowerCase() === 'enterprise' || clinic.plan?.toLowerCase() === 'enterprise') ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Unlimited Doctor Accounts</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Unlimited Patient Records</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Custom EHR Integration</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>24/7 Dedicated Account Manager</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Up to 5 Doctor Accounts</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Unlimited Patient Records</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>AI Pre-Assessment Triage</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Priority Clinical Support</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-muted/30 border border-dashed border-border text-[11px] text-muted-foreground flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Prototype / Demo Plan:</strong> This facility is currently running on a sponsored evaluation tier. All limits and AI triage tools are fully enabled for demonstration purposes without recurring payment obligations.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </main>

      {/* Add Doctor Modal */}
      {isAddDoctorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <Card className="max-w-md w-full border-border shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg font-bold">Add Attending Doctor</CardTitle>
                <button
                  onClick={() => setIsAddDoctorOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>
              <CardDescription className="text-xs">
                Attach a physician to {clinic.name}.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleAddDoctorSubmit}>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Doctor Name *</label>
                  <Input
                    placeholder="e.g. Dr. Rajeshwari Nair"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Phone Number (Login ID) *</label>
                    <Input
                      type="tel"
                      placeholder="e.g. 9876500002"
                      value={newDoctor.phone}
                      onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Login Password *</label>
                    <Input
                      type="text"
                      placeholder="e.g. doc123"
                      value={newDoctor.password}
                      onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Qualification</label>
                    <Input
                      placeholder="e.g. BAMS, MD"
                      value={newDoctor.qualification}
                      onChange={(e) => setNewDoctor({ ...newDoctor, qualification: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Speciality</label>
                    <Input
                      placeholder="e.g. Kayachikitsa"
                      value={newDoctor.specialization}
                      onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Consultation Fee (₹)</label>
                    <Input
                      type="number"
                      value={newDoctor.consultationFee}
                      onChange={(e) => setNewDoctor({ ...newDoctor, consultationFee: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Experience</label>
                    <Input
                      placeholder="e.g. 8 Years"
                      value={newDoctor.experience}
                      onChange={(e) => setNewDoctor({ ...newDoctor, experience: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Available Schedule</label>
                  <Input
                    placeholder="e.g. Mon - Sat (10:00 AM - 04:00 PM)"
                    value={newDoctor.availableDays}
                    onChange={(e) => setNewDoctor({ ...newDoctor, availableDays: e.target.value })}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddDoctorOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="gap-1.5 font-semibold">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Doctor</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <div className="flex items-center space-x-3">
            <MediKioskLogo size="sm" showSubtitle={false} asLink={false} />
            <span className="pl-2 border-l border-border font-mono text-[11px]">
              {clinic.name} • Private Clinic Portal
            </span>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
            <span>Authenticated Clinic Session</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ClinicDashboard
