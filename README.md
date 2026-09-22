Live Demo link = "https://medikiosk-zeta-one.vercel.app/"

# MediKiosk (SIH26047)

> **"Your story, structured for better care."**

MediKiosk is a hackathon MVP foundation designed to transform unstructured patient health stories into structured clinical intake and triage for primary health centers and clinics.

---

## Tech Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (with CSS variable tokens)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Architecture**: JavaScript / JSX (uncluttered, maintainable)

---

## Design System Tokens
- **Primary / Dark**: Pine (`#1F3A34`)
- **Secondary / Success**: Sage (`#6B8F71`)
- **Accent**: Turmeric (`#C97D3D`)
- **Background**: Parchment (`#FAF9F6`)
- **Text / Ink**: Ink (`#1C1B19`)

### Typography
- **Headings**: `Fraunces` (Editorial serif)
- **Body & Multilingual**: `Hind` (Humanist sans-serif with Devanagari support)
- **Timestamps & Codes**: `IBM Plex Mono` (Monospace)

---

## 11 Application Routes

| Route | View | Description |
|---|---|---|
| `/` | Portal Home | Master directory and role navigation |
| `/clinic/register` | Clinic Registration | Terminal pairing and setup |
| `/clinic/dashboard` | Clinic Dashboard | Patient arrival queue & kiosk status |
| `/doctor/dashboard` | Doctor Dashboard | Clinical story review & triage |
| `/patient/language` | Patient Language | Step 1: High-accessibility multilingual selection |
| `/patient/login` | Patient Login | Step 2: ABHA ID / mobile check-in |
| `/patient/consent` | Patient Consent | Step 3: ABDM privacy agreement |
| `/patient/assessment` | Patient Assessment | Step 4: Structured symptom questionnaire |
| `/patient/documents` | Patient Documents | Step 5: Document scanner / upload placeholder |
| `/patient/summary` | Patient Summary | Step 6: Recorded intake review |
| `/patient/export` | Patient Export | Step 7: Queue token receipt & QR code |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```
