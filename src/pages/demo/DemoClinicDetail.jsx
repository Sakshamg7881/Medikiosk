import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import {
  MapPin,
  Phone,
  Clock,
  Star,
  ArrowLeft,
  Navigation,
  Building2,
  Stethoscope,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { getClinicById, getDoctorsByClinicId } from '@/data/clinicsData'

export function DemoClinicDetail() {
  const { clinicId } = useParams()
  const clinic = getClinicById(clinicId) || getClinicById('c1')
  const doctors = getDoctorsByClinicId(clinic?.id)

  const [directionsModal, setDirectionsModal] = useState(false)
  const [callModal, setCallModal] = useState(false)

  if (!clinic) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="font-serif text-2xl font-bold mb-2">Clinic Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6">The requested demo clinic does not exist.</p>
        <Link to="/demo">
          <Button variant="default">Back to Product Tour</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Brand Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/demo" className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-base">
                M
              </div>
              <span className="font-serif text-lg font-bold tracking-tight text-foreground">
                MediKiosk
              </span>
            </Link>
            <Badge variant="outline" className="font-mono text-[10px]">
              Demo Mode
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <Link to="/demo">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Product Tour</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Link to="/demo#clinics-preview">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Clinic Discovery</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Demo Stage 02</span>
            <Badge variant="secondary" className="font-mono text-[10px]">
              Clinic Profile
            </Badge>
          </div>
        </div>

        {/* Clinic Overview Card */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="p-6 pb-4 border-b border-border/70 bg-muted/10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {clinic.ayushSystem}
                  </Badge>
                  <span className="flex items-center text-xs font-mono text-foreground font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mr-1 inline" />
                    {clinic.rating} ({clinic.reviewCount} reviews)
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {clinic.name}
                </h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {clinic.area}, {clinic.city}
                </p>
              </div>

              <Badge variant="success" className="self-start text-xs">
                {clinic.availability}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5 text-xs">
            {/* Quick Details Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-md bg-muted/30 border border-border/60 space-y-1">
                <span className="font-mono text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  Address
                </span>
                <p className="text-foreground leading-relaxed">{clinic.address}</p>
              </div>

              <div className="p-3 rounded-md bg-muted/30 border border-border/60 space-y-1">
                <span className="font-mono text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  Phone & Contact
                </span>
                <p className="text-foreground font-mono">{clinic.phone}</p>
              </div>

              <div className="p-3 rounded-md bg-muted/30 border border-border/60 space-y-1">
                <span className="font-mono text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-secondary" />
                  Hours
                </span>
                <p className="text-foreground font-mono">{clinic.openingHours}</p>
              </div>
            </div>

            {/* About Facility */}
            <div className="space-y-1.5 pt-1">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                About This Facility
              </span>
              <p className="text-foreground/90 leading-relaxed text-sm bg-muted/20 p-4 rounded-md border border-border/60">
                {clinic.about}
              </p>
            </div>

            {/* Amenities */}
            {clinic.amenities && clinic.amenities.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Facility Amenities
                </span>
                <div className="flex flex-wrap gap-2">
                  {clinic.amenities.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-muted/40 border border-border text-xs text-foreground font-medium"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-muted/10">
            <div className="font-mono text-xs text-muted-foreground">
              Consultation Fee: <strong className="text-foreground text-sm font-semibold">₹{clinic.consultationFee}</strong>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setDirectionsModal(true)}
              >
                <Navigation className="h-3.5 w-3.5 text-accent" />
                <span>Get Directions</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setCallModal(true)}
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>Call Clinic</span>
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Doctor List at Clinic */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
                Attending Physicians
              </h2>
              <p className="text-muted-foreground text-xs">
                Select a doctor to view their profile, consultation slots, and clinical focus.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {doctors.length} Doctor{doctors.length === 1 ? '' : 's'}
            </Badge>
          </div>

          <div className="space-y-3">
            {doctors.map((doc) => (
              <Card
                key={doc.id}
                className="border-border hover:border-primary/50 transition-all shadow-2xs"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-base font-bold text-foreground">
                        {doc.name}
                      </span>
                      <Badge variant="secondary" className="text-[10px] py-0 font-mono">
                        {doc.qualification}
                      </Badge>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-semibold flex items-center">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-0.5" />
                        {doc.rating}
                      </span>
                    </div>

                    <p className="text-xs text-primary font-medium">
                      {doc.specialization} • {doc.ayushSystem}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono pt-0.5">
                      <span>{doc.experience}</span>
                      <span>•</span>
                      <span>Languages: {doc.languages.join(', ')}</span>
                      <span>•</span>
                      <span className="text-foreground font-semibold">Fee: ₹{doc.consultationFee}</span>
                    </div>

                    <p className="text-xs text-muted-foreground pt-1 line-clamp-2">
                      {doc.about}
                    </p>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <Link to={`/demo/doctor/${doc.id}`}>
                      <Button size="sm" className="gap-1.5 font-semibold">
                        <span>Select Doctor</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Directions Modal */}
      {directionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="font-serif font-bold text-base">{clinic.name}</h3>
              </div>
              <button
                onClick={() => setDirectionsModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                âœ•
              </button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground text-sm">{clinic.name}</strong>
                <br />
                {clinic.address}
              </p>
              <p>
                <strong className="text-foreground">Phone:</strong> {clinic.phone}
              </p>
              <p className="p-2.5 rounded bg-muted/40 font-mono text-[11px] text-foreground">
                Operating Hours: {clinic.openingHours}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(clinic.name + ' ' + clinic.city)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <span>Open External Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
              <Button size="sm" variant="default" onClick={() => setDirectionsModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Call Clinic Modal */}
      {callModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <h3 className="font-serif font-bold text-base">Call Clinic Reception</h3>
              </div>
              <button
                onClick={() => setCallModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                âœ•
              </button>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                Connecting you to <strong>{clinic.name}</strong> front desk:
              </p>
              <div className="p-3 bg-muted/40 rounded-md font-mono text-center text-sm font-bold text-foreground">
                {clinic.phone}
              </div>
              <p className="text-[11px]">
                In this demo environment, calling uses your device's standard telephone dialer.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <a href={`tel:${clinic.phone.replace(/\s+/g, '')}`}>
                <Button size="sm" variant="default" className="text-xs gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>Dial Now</span>
                </Button>
              </a>
              <Button size="sm" variant="outline" onClick={() => setCallModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default DemoClinicDetail
