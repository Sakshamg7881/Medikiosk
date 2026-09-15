import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  HeartPulse,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Coffee,
  Moon,
  Activity,
  HelpCircle,
  X,
} from 'lucide-react'
import { generateDailyCareCardPdf } from '@/lib/pdfReportGenerator'

export function DailyCareCard({ caseData, isOpen, onClose }) {
  if (!isOpen && isOpen !== undefined) return null

  const patient = caseData?.patient || {}
  const caseId = caseData?.caseId || '04'
  const patientName = patient.name || 'Patient'
  const ayush = caseData?.ayushData || {}
  const chiefComplaint = caseData?.chiefComplaint || 'Consultation Intake'
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const handleDownload = () => {
    generateDailyCareCardPdf(caseData)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-card border-2 border-primary/40 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-serif text-lg font-bold">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-foreground">
                  Daily Care Card
                </h3>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Patient Reminders
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                MediKiosk Personal Pre-Consultation Notes
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-sm font-mono p-1 rounded-md hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Patient Pill */}
        <div className="p-3 bg-muted/40 rounded-lg border border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-mono text-[10px] text-muted-foreground block">Patient Name</span>
            <strong className="text-foreground text-sm font-serif">{patientName}</strong>
          </div>
          <div>
            <span className="font-mono text-[10px] text-muted-foreground block">Token • Case</span>
            <span className="font-mono font-bold text-primary">Token #{String(caseId).padStart(2, '0')}</span>
          </div>
          <div>
            <span className="font-mono text-[10px] text-muted-foreground block">Date</span>
            <span className="font-mono text-muted-foreground">{dateStr}</span>
          </div>
        </div>

        {/* Chief Concern */}
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs space-y-1">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
            Primary Concern Reported
          </span>
          <p className="font-serif font-bold text-foreground text-sm">
            {chiefComplaint}
          </p>
        </div>

        {/* Section: General Self-Care Reminders */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-secondary" />
            <h4 className="font-serif font-bold text-sm text-foreground">
              General Daily Self-Care Reminders
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-md bg-muted/30 border border-border/60 space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Coffee className="h-3.5 w-3.5 text-accent" />
                Warm Hydration
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Drink clean, lukewarm water at regular intervals throughout the day.
              </p>
            </div>

            <div className="p-2.5 rounded-md bg-muted/30 border border-border/60 space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5 text-secondary" />
                Rest & Sleep
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Ensure 7 to 8 hours of quiet sleep in a restful, well-ventilated room.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Routine Observations to Note for Your Doctor */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h4 className="font-serif font-bold text-sm text-foreground">
              Routine Observations to Note for Your Doctor
            </h4>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="p-2 rounded bg-muted/25 border border-border/50 text-foreground/90 flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
              <span>
                <strong>Digestion:</strong> Note how comfortably you digest different meals ({ayush.agni || 'Recorded in intake'}).
              </span>
            </div>
            <div className="p-2 rounded bg-muted/25 border border-border/50 text-foreground/90 flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
              <span>
                <strong>Sleep Pattern:</strong> Observe whether sleeping at a fixed hour improves morning freshness ({ayush.nidra || 'Recorded in intake'}).
              </span>
            </div>
            <div className="p-2 rounded bg-muted/25 border border-border/50 text-foreground/90 flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
              <span>
                <strong>Elimination:</strong> Notice if warm morning fluids support regular bowel habits ({ayush.mala || 'Recorded in intake'}).
              </span>
            </div>
          </div>
        </div>

        {/* Section: Discuss with Doctor */}
        <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/30 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-secondary font-bold">
            <HelpCircle className="h-4 w-4" />
            <span>Points to Discuss with Your AYUSH Doctor</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>What dietary guidelines (Pathya / Apathya) are best for your condition?</li>
            <li>Are there specific herbal teas or home regimen suitable for your constitution?</li>
            <li>Ask about daily routine (Dinacharya) practices that support sustained vitality.</li>
          </ul>
        </div>

        {/* Ethical Safety Disclaimer */}
        <div className="p-3 rounded-md bg-muted/40 border border-border/80 text-[11px] text-muted-foreground flex items-start gap-2 leading-relaxed">
          <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
          <span>
            <strong>Healthcare Safety Notice:</strong> This Daily Care Card provides general traditional wellness reminders based on your intake conversation. It does NOT constitute medical advice, a prescription, or a medical diagnosis. Do not start, stop, or modify any medications without the explicit guidance of your consulting AYUSH physician.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="w-full sm:w-auto gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Care Card</span>
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              className="w-full sm:w-auto gap-1.5 font-semibold text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Care Card PDF</span>
            </Button>
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="w-full sm:w-auto text-xs"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyCareCard
