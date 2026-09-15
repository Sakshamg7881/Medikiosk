import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
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
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { getClinicById, getDoctorsByClinicId } from '@/data/clinicsData'
import { getPatientSession, setSelectedClinic, setSelectedDoctor } from '@/lib/session'

export function PatientClinicDetail() {
  const { clinicId } = useParams()
  const session = getPatientSession()
  const lang = session.preferredLanguage || 'en'

  const clinic = getClinicById(clinicId) || getClinicById('c1')
  const doctors = getDoctorsByClinicId(clinic?.id)

  const [directionsModal, setDirectionsModal] = useState(false)

  if (!clinic) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="font-serif text-xl font-bold">Clinic Not Found</h2>
        <Link to="/patient/clinics">
          <Button variant="outline">Browse All Clinics</Button>
        </Link>
      </div>
    )
  }

  const handleSelectDoctor = (docId) => {
    setSelectedClinic(clinic.id)
    setSelectedDoctor(docId)
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Link to="/patient/clinics">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Clinics</span>
          </Button>
        </Link>
        <Badge variant="outline" className="font-mono text-xs">
          Clinic Profile
        </Badge>
      </div>

      {/* Clinic Header Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-border/70 bg-muted/10">
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

        <CardContent className="p-5 space-y-4 text-xs">
          {/* Address, Phone, Hours */}
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
                Phone & Inquiries
              </span>
              <p className="text-foreground font-mono">{clinic.phone}</p>
            </div>

            <div className="p-3 rounded-md bg-muted/30 border border-border/60 space-y-1">
              <span className="font-mono text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-secondary" />
                Operating Hours
              </span>
              <p className="text-foreground font-mono">{clinic.openingHours}</p>
            </div>
          </div>

          {/* About Clinic */}
          <div className="space-y-1.5 pt-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              About This Facility
            </span>
            <p className="text-foreground/90 leading-relaxed text-sm bg-muted/20 p-3.5 rounded-md border border-border/60">
              {clinic.about}
            </p>
          </div>

          {/* Amenities */}
          {clinic.amenities && clinic.amenities.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Facility Features
              </span>
              <div className="flex flex-wrap gap-2">
                {clinic.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-muted/50 border border-border text-[11px] text-foreground font-medium"
                  >
                    <CheckCircle2 className="h-3 w-3 text-secondary" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-2 bg-muted/10">
          <div className="font-mono text-xs text-muted-foreground">
            Standard Consultation: <strong className="text-foreground text-sm font-semibold">â‚¹{clinic.consultationFee}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setDirectionsModal(true)}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Get Directions</span>
            </Button>
            <a href={`tel:${clinic.phone.replace(/\s+/g, '')}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Phone className="h-3.5 w-3.5" />
                <span>Call Clinic</span>
              </Button>
            </a>
          </div>
        </CardFooter>
      </Card>

      {/* Section: Doctors at this Clinic */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
              Doctors at this Clinic
            </h2>
            <p className="text-muted-foreground text-xs">
              Select an attending AYUSH physician for your consultation and case preparation.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {doctors.length} Specialist{doctors.length === 1 ? '' : 's'}
          </Badge>
        </div>

        <div className="space-y-3">
          {doctors.map((doc) => (
            <Card
              key={doc.id}
              className="border-border hover:border-primary/50 transition-all shadow-2xs"
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Doctor info */}
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
                    {doc.specialization}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono pt-0.5">
                    <span>{doc.experience}</span>
                    <span>•</span>
                    <span>Languages: {doc.languages.join(', ')}</span>
                    <span>•</span>
                    <span className="text-foreground font-semibold">Fee: â‚¹{doc.consultationFee}</span>
                  </div>

                  <p className="text-xs text-muted-foreground pt-1 line-clamp-2">
                    {doc.about}
                  </p>
                </div>

                {/* Right Action */}
                <div className="self-end sm:self-center shrink-0">
                  <Link
                    to={`/patient/doctor/${doc.id}`}
                    onClick={() => handleSelectDoctor(doc.id)}
                  >
                    <Button size="sm" className="gap-1.5 font-semibold">
                      <span>View Doctor</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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
                <strong className="text-foreground">Address:</strong>
                <br />
                {clinic.address}
              </p>
              <p>
                <strong className="text-foreground">Phone:</strong> {clinic.phone}
              </p>
              <p className="p-2.5 rounded bg-muted/40 font-mono text-[11px] text-foreground">
                Hours: {clinic.openingHours}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(clinic.name + ' ' + clinic.city)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="outline" className="text-xs">
                  Open External Maps
                </Button>
              </a>
              <Button size="sm" variant="default" onClick={() => setDirectionsModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default PatientClinicDetail
