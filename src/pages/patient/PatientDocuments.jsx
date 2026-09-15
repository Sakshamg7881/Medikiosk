import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  FileCheck,
  Pill,
  Activity,
  PlusCircle,
  X,
} from 'lucide-react'
import { getPatientSession } from '@/lib/session'
import { uploadCaseDocument, getCaseSummary } from '@/lib/api'

export function PatientDocuments() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [session, setSession] = useState(getPatientSession())
  const [caseId, setCaseId] = useState(null)
  const [selectedDocType, setSelectedDocType] = useState('PRESCRIPTION')
  const [selectedFile, setSelectedFile] = useState(null)
  const [processState, setProcessState] = useState('idle') // idle | selected | uploading | extracting | structuring | completed | error
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)

  const lang = session.preferredLanguage || 'en'

  useEffect(() => {
    const s = getPatientSession()
    setSession(s)

    if (!s.patientId) {
      navigate('/patient/login')
      return
    }

    if (!s.consentAccepted) {
      navigate('/patient/consent')
      return
    }

    if (s.caseId) {
      setCaseId(s.caseId)
      fetchExistingDocuments(s.caseId)
    }
  }, [navigate])

  const fetchExistingDocuments = async (cId) => {
    try {
      setIsLoadingSummary(true)
      const data = await getCaseSummary(cId)
      if (data && data.documents && Array.isArray(data.documents)) {
        setUploadedDocs(data.documents)
      }
    } catch (err) {
      console.warn('Could not load prior documents:', err.message)
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const docTypes = [
    { id: 'PRESCRIPTION', label: lang === 'hi' ? 'डॉक्टर की पर्ची' : lang === 'hinglish' ? 'Prescription Parchi' : 'Prescription', sub: 'Prescription' },
    { id: 'LAB_REPORT', label: lang === 'hi' ? 'लैब रिपोर्ट' : lang === 'hinglish' ? 'Lab / Blood Report' : 'Lab Report', sub: 'Lab Test' },
    { id: 'MEDICAL_REPORT', label: lang === 'hi' ? 'मेडिकल रिपोर्ट' : lang === 'hinglish' ? 'Medical Report' : 'Medical Report', sub: 'Discharge / Scan' },
    { id: 'OTHER', label: lang === 'hi' ? 'अन्य दस्तावेज़' : lang === 'hinglish' ? 'Anya Record' : 'Other Record', sub: 'Other' },
  ]

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      setErrorMessage(
        lang === 'hi'
          ? 'केवल PDF, JPG या PNG फाइलें समर्थित हैं।'
          : 'Only PDF, JPG, or PNG files are supported.'
      )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        lang === 'hi'
          ? 'फ़ाइल का आकार 10MB से कम होना चाहिए।'
          : 'File size must be under 10MB.'
      )
      return
    }

    setErrorMessage('')
    setSelectedFile(file)
    setProcessState('selected')
  }

  const handleUploadAndProcess = async () => {
    if (!selectedFile || !caseId) return

    setErrorMessage('')
    setProcessState('uploading')
    setStatusMessage(
      lang === 'hi'
        ? 'दस्तावेज़ अपलोड हो रहा है...'
        : lang === 'hinglish'
        ? 'Document upload ho raha hai...'
        : 'Uploading document to secure kiosk storage...'
    )

    // Simulated progress transitions for tactile kiosk UX
    const timer1 = setTimeout(() => {
      setProcessState('extracting')
      setStatusMessage(
        lang === 'hi'
          ? 'टेक्स्ट एवं ओसीआर विश्लेषण जारी है...'
          : lang === 'hinglish'
          ? 'OCR & text extract kiya ja raha hai...'
          : 'Extracting text and digital records via OCR...'
      )
    }, 900)

    const timer2 = setTimeout(() => {
      setProcessState('structuring')
      setStatusMessage(
        lang === 'hi'
          ? 'एआई क्लिनिकल सारांश तैयार कर रहा है...'
          : lang === 'hinglish'
          ? 'AI medicines aur findings structure kar raha hai...'
          : 'Structuring clinical data, medications & findings...'
      )
    }, 2200)

    try {
      const res = await uploadCaseDocument(caseId, selectedFile, selectedDocType)
      clearTimeout(timer1)
      clearTimeout(timer2)

      setProcessState('completed')
      setStatusMessage(
        lang === 'hi'
          ? 'दस्तावेज़ सफलतापूर्वक विश्लेषित हो गया!'
          : lang === 'hinglish'
          ? 'Document analyze aur save ho gaya!'
          : 'Document successfully extracted and saved!'
      )

      // Refresh document list
      setUploadedDocs((prev) => [
        ...prev,
        {
          documentId: res.documentId,
          fileName: res.fileName,
          documentType: res.documentType,
          fileSize: res.fileSize,
          ocrStatus: res.ocrStatus,
          structuredData: res.structuredData,
          redFlags: res.redFlags || [],
        },
      ])

      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      clearTimeout(timer1)
      clearTimeout(timer2)
      setProcessState('error')
      setErrorMessage(
        err.message ||
          (lang === 'hi'
            ? 'दस्तावेज़ प्रसंस्करण विफल रहा। कृपया पुनः प्रयास करें।'
            : 'Document processing failed. Please try again.')
      )
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 pb-8">
      {/* Navigation & Step Header */}
      <div className="flex items-center justify-between">
        <Link to="/patient/assessment">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === 'hi' ? 'पीछे (Back)' : lang === 'hinglish' ? 'Peeche' : 'Back'}</span>
          </Button>
        </Link>
        <Badge variant="outline">Step 5 of 7 • Documents</Badge>
      </div>

      <div className="text-center space-y-1">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          {lang === 'hi'
            ? 'चिकित्सा दस्तावेज़ जोड़ें'
            : 'Add Medical Documents'}
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          {lang === 'hi'
            ? 'परामर्श के लिए पिछली पर्ची या टेस्ट रिपोर्ट अपलोड करें, या सीधे आगे बढ़ें।'
            : 'Attach previous prescriptions or lab reports for your doctor, or continue directly.'}
        </p>
      </div>

      {/* Document Type Selector Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider block">
          {lang === 'hi' ? 'दस्तावेज़ का प्रकार चुनें' : '1. Select Document Type'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {docTypes.map((t) => {
            const isSelected = selectedDocType === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedDocType(t.id)}
                className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary text-foreground'
                    : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="text-xs font-semibold">{t.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t.sub}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Upload Dropzone Card */}
      <Card className="border-border shadow-xs">
        <CardContent className="pt-6 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-7 text-center transition-all cursor-pointer ${
              selectedFile
                ? 'border-primary/60 bg-primary/5'
                : 'border-border bg-muted/20 hover:bg-muted/40'
            }`}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <div className="font-semibold text-foreground text-sm flex items-center justify-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-primary" />
                  <span>{selectedFile.name}</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {formatFileSize(selectedFile.size)} • {selectedDocType}
                </div>
                <p className="text-[11px] text-primary pt-1 font-medium">
                  {lang === 'hi' ? 'फ़ाइल बदलने के लिए यहाँ क्लिक करें' : 'Click to choose a different file'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="font-medium text-foreground text-sm">
                  {lang === 'hi'
                    ? 'फ़ाइल चुनने के लिए क्लिक करें'
                    : 'Click to select prescription or report'}
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, or PNG (Max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Processing Status Banner */}
          {['uploading', 'extracting', 'structuring'].includes(processState) && (
            <div className="p-4 rounded-md border border-primary/30 bg-primary/5 flex items-center space-x-3 text-xs">
              <RefreshCw className="h-5 w-5 animate-spin text-primary shrink-0" />
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">{statusMessage}</div>
                <div className="text-muted-foreground text-[11px]">
                  {processState === 'uploading'
                    ? 'Step 1 of 3 • Uploading'
                    : processState === 'extracting'
                    ? 'Step 2 of 3 • OCR Text Extraction'
                    : 'Step 3 of 3 • AI Clinical Structuring'}
                </div>
              </div>
            </div>
          )}

          {processState === 'completed' && (
            <div className="p-3.5 rounded-md border border-secondary/40 bg-secondary/10 flex items-center space-x-2 text-xs text-secondary-foreground">
              <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-md border border-destructive/30 bg-destructive/5 flex items-center space-x-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Action Trigger */}
          {selectedFile && !['uploading', 'extracting', 'structuring'].includes(processState) && (
            <Button
              size="lg"
              onClick={handleUploadAndProcess}
              className="w-full justify-center gap-2 font-medium"
            >
              <UploadCloud className="h-4 w-4" />
              <span>
                {lang === 'hi'
                  ? 'दस्तावेज़ प्रोसेस करें (Extract with AI)'
                  : 'Process & Extract Document'}
              </span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Processed Documents List */}
      {uploadedDocs.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>
                  {lang === 'hi' ? 'संलग्न रिकॉर्ड्स' : 'Processed Documents'} ({uploadedDocs.length})
                </span>
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                Verified Records
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-3 divide-y divide-border/60 text-xs">
            {uploadedDocs.map((doc, idx) => {
              const meds = doc.structuredData?.medicines || []
              const findings = doc.structuredData?.importantFindings || []
              const labs = doc.structuredData?.labResults || []

              return (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" />
                        <span>{doc.fileName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                          {doc.documentType}
                        </Badge>
                        {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Highlights from Gemini Structuring */}
                  {(meds.length > 0 || findings.length > 0 || labs.length > 0) && (
                    <div className="p-2 bg-muted/40 rounded-md space-y-1 text-[11px] text-muted-foreground">
                      {meds.length > 0 && (
                        <div className="flex items-baseline gap-1 text-foreground/90">
                          <Pill className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                          <span>
                            <strong>Medicines:</strong> {meds.slice(0, 3).join(', ')}
                            {meds.length > 3 && ` +${meds.length - 3} more`}
                          </span>
                        </div>
                      )}
                      {findings.length > 0 && (
                        <div>
                          <strong>Key Findings:</strong> {findings.slice(0, 2).join('; ')}
                        </div>
                      )}
                      {labs.length > 0 && (
                        <div>
                          <strong>Lab Values:</strong> {labs.slice(0, 2).join('; ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Navigation Footer */}
      <div className="pt-2">
        <Link to="/patient/summary" className="block w-full">
          <Button size="xl" className="w-full justify-between font-semibold">
            <span>
              {lang === 'hi'
                ? 'केस सारांश देखें और आगे बढ़ें'
                : 'Continue to Case Summary'}
            </span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
