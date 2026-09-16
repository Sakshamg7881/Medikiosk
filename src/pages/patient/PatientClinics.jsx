import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Search,
  MapPin,
  Star,
  Clock,
  Filter,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Navigation,
  Building2,
  Stethoscope,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { getAllClinics, getClinicById } from '@/data/clinicsData'
import { getPatientSession, setSelectedClinic, setConsentAccepted } from '@/lib/session'

export function PatientClinics() {
  const navigate = useNavigate()
  const session = getPatientSession()
  const lang = session.preferredLanguage || 'en'

  const allClinics = useMemo(() => getAllClinics(), [])

  // Selected Clinic State (initialized from session if present)
  const [selectedClinicId, setSelectedClinicId] = useState(session.selectedClinicId || null)

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('ALL')
  const [systemFilter, setSystemFilter] = useState('ALL')
  const [feeFilter, setFeeFilter] = useState('ALL')
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('RECOMMENDED')

  // Directions modal
  const [selectedForDirections, setSelectedForDirections] = useState(null)

  // Filter logic
  const filteredClinics = useMemo(() => {
    return allClinics
      .filter((clinic) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchesName = clinic.name.toLowerCase().includes(q)
          const matchesCity = clinic.city.toLowerCase().includes(q)
          const matchesArea = clinic.area.toLowerCase().includes(q)
          const matchesSystem = clinic.ayushSystem.toLowerCase().includes(q)
          if (!matchesName && !matchesCity && !matchesArea && !matchesSystem) return false
        }

        // City
        if (cityFilter !== 'ALL' && clinic.city !== cityFilter) return false

        // AYUSH System
        if (systemFilter !== 'ALL' && clinic.ayushSystem !== systemFilter) return false

        // Fee
        if (feeFilter === 'UNDER_400' && clinic.consultationFee >= 400) return false
        if (feeFilter === '400_600' && (clinic.consultationFee < 400 || clinic.consultationFee > 600)) return false
        if (feeFilter === 'ABOVE_600' && clinic.consultationFee <= 600) return false

        // Availability
        if (availabilityFilter === 'TODAY' && clinic.availability !== 'Available Today') return false
        if (availabilityFilter === 'TOMORROW' && clinic.availability !== 'Available Tomorrow') return false

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'FEE_ASC') return a.consultationFee - b.consultationFee
        if (sortBy === 'AVAILABLE_TODAY') {
          if (a.availability === 'Available Today' && b.availability !== 'Available Today') return -1
          if (b.availability === 'Available Today' && a.availability !== 'Available Today') return 1
        }
        return b.rating - a.rating
      })
  }, [allClinics, searchQuery, cityFilter, systemFilter, feeFilter, availabilityFilter, sortBy])

  const cities = ['Delhi', 'Jaipur', 'Lucknow', 'Bhopal', 'Bengaluru', 'Mumbai']
  const systems = ['Ayurveda', 'Mixed AYUSH', 'Yoga & Naturopathy']

  const handleSelectClinic = (clinicId) => {
    setSelectedClinicId(clinicId)
    setSelectedClinic(clinicId)
  }

  const handleClearClinic = () => {
    setSelectedClinicId(null)
    setSelectedClinic(null)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const handleStartHealthAssessment = (clinicId) => {
    const targetId = clinicId || selectedClinicId
    if (!targetId) return
    setSelectedClinicId(targetId)
    setSelectedClinic(targetId)
    setConsentAccepted(true)
    navigate('/patient/assessment')
  }

  const activeSelectedClinic = selectedClinicId ? getClinicById(selectedClinicId) : null

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-28">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link to="/patient/login">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Login</span>
          </Button>
        </Link>
        <Badge variant="outline" className="font-mono text-xs">
          Step 2 • Clinic Selection
        </Badge>
      </div>

      {/* Page Heading & Supporting Text (Exact Specification) */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Choose your clinic
        </h1>
        <p className="text-muted-foreground text-sm">
          Select where you'd like to continue your consultation.
        </p>
      </div>

      {/* ACTIVE "SELECTED CLINIC" BANNER (When a clinic is selected) */}
      {activeSelectedClinic && (
        <Card className="border-2 border-primary/50 bg-primary/5 shadow-xs animate-in fade-in-50 duration-200">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                  Selected Clinic
                </span>
                <Badge variant="secondary" className="text-[10px] py-0 font-medium">
                  {activeSelectedClinic.ayushSystem}
                </Badge>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                {activeSelectedClinic.name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>{activeSelectedClinic.area}, {activeSelectedClinic.city}</span>
                <span>•</span>
                <span>{activeSelectedClinic.doctorsCount} Available Doctors</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleClearClinic}
                className="flex-1 sm:flex-none text-xs border-border hover:bg-background"
              >
                Change Clinic
              </Button>

              <Button
                type="button"
                size="md"
                onClick={() => handleStartHealthAssessment(activeSelectedClinic.id)}
                className="flex-1 sm:flex-none gap-2 font-semibold text-xs shadow-xs"
              >
                <span>Start Health Assessment</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          sizeVariant="lg"
          placeholder='Search clinic, area or city...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter & Sort Controls */}
      <div className="p-4 bg-muted/20 rounded-lg border border-border space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground font-semibold">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters & Sorting</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {/* City Filter */}
          <div>
            <label className="text-[11px] font-mono text-muted-foreground block mb-1">City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* System Filter */}
          <div>
            <label className="text-[11px] font-mono text-muted-foreground block mb-1">AYUSH System</label>
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Systems</option>
              {systems.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Filter */}
          <div>
            <label className="text-[11px] font-mono text-muted-foreground block mb-1">Consultation Fee</label>
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Fees</option>
              <option value="UNDER_400">Under ₹400</option>
              <option value="400_600">₹400 - ₹600</option>
              <option value="ABOVE_600">Above ₹600</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="text-[11px] font-mono text-muted-foreground block mb-1">Availability</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">Any Time</option>
              <option value="TODAY">Available Today</option>
              <option value="TOMORROW">Available Tomorrow</option>
            </select>
          </div>

          {/* Sort Option */}
          <div>
            <label className="text-[11px] font-mono text-muted-foreground block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="RECOMMENDED">Recommended</option>
              <option value="FEE_ASC">Fee: Low to High</option>
              <option value="AVAILABLE_TODAY">Available Today</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
        <span>
          Showing {filteredClinics.length} AYUSH Clinic{filteredClinics.length === 1 ? '' : 's'}
        </span>
        <span className="text-[11px] italic">Accredited AYUSH Provider Network</span>
      </div>

      {/* Clinics Card Grid */}
      {filteredClinics.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-card rounded-lg border border-border">
          <Building2 className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="font-serif text-base font-semibold">No clinics match your criteria</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query, city, or fee filter to explore more AYUSH facilities.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              setCityFilter('ALL')
              setSystemFilter('ALL')
              setFeeFilter('ALL')
              setAvailabilityFilter('ALL')
            }}
          >
            Reset All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClinics.map((clinic) => {
            const isToday = clinic.availability === 'Available Today'
            const isSelected = selectedClinicId === clinic.id

            return (
              <Card
                key={clinic.id}
                className={`transition-all flex flex-col justify-between shadow-2xs ${
                  isSelected
                    ? 'border-2 border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/10">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold font-serif text-foreground leading-snug">
                        {clinic.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                          {clinic.ayushSystem}
                        </Badge>
                        <span className="flex items-center text-[11px] font-mono text-foreground font-semibold">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-1 inline" />
                          {clinic.rating} ({clinic.reviewCount})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected && (
                        <Badge variant="default" className="text-[10px] py-0 bg-primary font-semibold">
                          Selected
                        </Badge>
                      )}
                      <Badge
                        variant={isToday ? 'success' : 'outline'}
                        className="text-[10px] py-0"
                      >
                        {clinic.availability}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 text-xs space-y-2.5 flex-1">
                  <div className="flex items-start gap-1.5 text-muted-foreground leading-relaxed">
                    <MapPin className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                    <span>
                      {clinic.area}, {clinic.city}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-muted/30 border border-border/50 flex items-center justify-between font-mono text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Consultation</span>
                      <strong className="text-foreground text-sm font-semibold">
                        ₹{clinic.consultationFee}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block text-[10px]">Available Doctors</span>
                      <span className="font-semibold text-foreground">
                        {clinic.doctorsCount} Doctors
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-2 border-t border-border flex items-center justify-between gap-2 bg-muted/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedForDirections(clinic)}
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Directions</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      id={isSelected ? 'clinic-selected-btn' : 'select-clinic-btn'}
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => handleSelectClinic(clinic.id)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <span>Select Clinic</span>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR (When a clinic is selected) */}
      {activeSelectedClinic && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-lg p-3 sm:p-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Selected Clinic
                </span>
                <span className="font-serif font-bold text-sm sm:text-base text-foreground">
                  {activeSelectedClinic.name} ({activeSelectedClinic.city})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearClinic}
                className="text-xs"
              >
                Change Clinic
              </Button>
              <Button
                type="button"
                id="start-assessment-btn"
                size="sm"
                onClick={() => handleStartHealthAssessment(activeSelectedClinic.id)}
                className="gap-1.5 font-semibold text-xs shadow-xs flex-1 sm:flex-none"
              >
                <span>Start Health Assessment</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Directions Dialog */}
      {selectedForDirections && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="font-serif font-bold text-base">{selectedForDirections.name}</h3>
              </div>
              <button
                onClick={() => setSelectedForDirections(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">Full Address:</strong>
                <br />
                {selectedForDirections.address}
              </p>
              <p>
                <strong className="text-foreground">Phone:</strong> {selectedForDirections.phone}
              </p>
              <p className="p-2.5 rounded bg-muted/40 font-mono text-[11px] text-foreground">
                Clinic Hours: {selectedForDirections.openingHours}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(selectedForDirections.name + ' ' + selectedForDirections.city)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="outline" className="text-xs">
                  Open External Maps
                </Button>
              </a>
              <Button size="sm" variant="default" onClick={() => setSelectedForDirections(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientClinics
