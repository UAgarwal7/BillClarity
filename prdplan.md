# BillClarity — Finalized Product Requirements & Build Plan

> **AI Medical Bill Intelligence + Dispute Automation Platform**
> Hackathon MVP · Rocket Hacks 2026

---

## 1. Executive Summary

BillClarity is a patient-facing web application that:

1. Accepts uploaded medical bills & insurance EOBs.
2. Parses, classifies, and extracts structured line-item data (OCR → LLM normalization).
3. Explains every charge in plain language.
4. Visualizes the bill (category breakdown, payment flow Sankey, risk heatmap, benchmark deviation charts).
5. Benchmarks charges against Medicare fee schedules & public pricing data.
6. Detects billing errors (duplicates, mismatched dates, denied-but-billed, quantity anomalies).
7. Matches insurance rule opportunities (emergency protections, OON balance billing, denial appeal triggers).
8. Generates a downloadable **appeal packet** (PDF bundle: explanation report, flagged issues, benchmark analysis, appeal letter, negotiation script, evidence checklist).
9. Provides an **AI-assisted negotiation call agent** (Gemini ↔ ElevenLabs voice loop, real-time transcript + response generation).

**No authentication is required for the hackathon MVP.** All data is session-scoped or keyed by a transient `user_id`.

---

## 2. Existing Codebase Snapshot

| Layer | Stack |
|---|---|
| Build | Vite 6, pnpm |
| Framework | React 18, TypeScript |
| Routing | react-router v7 (`createBrowserRouter`) |
| Styling | TailwindCSS 4 (`@tailwindcss/vite`), `tw-animate-css` |
| UI Primitives | shadcn/ui (Radix), MUI 7, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Charts | Recharts 2 |
| Animation | Motion (Framer Motion successor) |
| Misc | lucide-react icons, Sonner toasts, vaul drawer, cmdk command palette |

### Pre-existing Routes (in `src/app/routes.ts`)

| Path | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Marketing / hero |
| `/app` | `AppLayout` | Sidebar shell (shared layout) |
| `/app` (index) | `UploadPage` | Document upload + intake form |
| `/app/bill-overview` | `BillOverviewPage` | Parsed bill summary |
| `/app/analysis` | `AnalysisPage` | Error detection + issue flags |
| `/app/benchmarking` | `BenchmarkingPage` | Price benchmarking dashboard |
| `/app/insurance-insights` | `InsuranceInsightsPage` | Insurance rule matching |
| `/app/appeal-packet` | `AppealPacketPage` | Appeal document builder |
| `/app/call-assistant` | `CallAssistantPage` | AI call agent interface |

All pages have **stub implementations** (placeholder UI). The plan below specifies what each page must contain in its final state.

---

## 3. Technology Architecture (Full Stack)

### 3.1 Frontend (this repo)

- **Vite + React + TailwindCSS 4** (already scaffolded).
- All UI is client-side SPA; communicates with backend via REST/WebSocket.
- PDF generation: use `@react-pdf/renderer` or `html2pdf.js` to export appeal packets client-side.
- Voice integration: ElevenLabs WebSocket streaming API for TTS; browser `MediaRecorder` + Web Speech API or Deepgram for STT.

### 3.2 Backend API (to be built)

| Concern | Technology |
|---|---|
| Runtime | Node.js or Python (FastAPI) on **Vultr Compute** |
| Object Storage | **AWS S3** — uploaded docs, generated PDFs |
| OCR | **AWS Textract** — tables, forms, raw text |
| AI Reasoning | **Google Gemini 2.0 Flash** via `@google/generative-ai` SDK |
| Database | **MongoDB Atlas** (free tier) |
| Call Orchestration | **n8n** self-hosted on Vultr |
| Voice Synthesis | **ElevenLabs** streaming TTS API |
| Transcription | ElevenLabs STT or Deepgram |

### 3.3 Infrastructure Diagram

```
┌──────────────┐      REST / WS       ┌──────────────────────┐
│   Frontend   │◄────────────────────►│   Backend API        │
│  (Vite SPA)  │                      │  (Vultr Compute)     │
└──────────────┘                      └──────┬───────────────┘
                                             │
                       ┌─────────────────────┼──────────────────────┐
                       │                     │                      │
                 ┌─────▼─────┐       ┌───────▼───────┐     ┌───────▼───────┐
                 │  AWS S3    │       │  MongoDB      │     │  Gemini API   │
                 │  (docs)    │       │  Atlas        │     │  (AI reason)  │
                 └─────┬─────┘       └───────────────┘     └───────────────┘
                       │
                 ┌─────▼─────┐
                 │  AWS       │
                 │  Textract  │
                 └───────────┘

                 ┌──────────────────┐
                 │  n8n (Vultr)     │ ◄── orchestrates call workflow
                 │  + ElevenLabs    │
                 └──────────────────┘
```

---

## 4. Data Models (MongoDB Collections)

### 4.1 `bills`

```jsonc
{
  "_id": ObjectId,
  "user_id": "string (session-scoped)",
  "provider": "string",
  "facility": "string",
  "visit_type": "string",          // ER, outpatient, inpatient, imaging, etc.
  "service_date_range": { "start": "ISO date", "end": "ISO date" },
  "total_billed": Number,
  "total_allowed": Number,
  "total_insurance_paid": Number,
  "patient_balance": Number,
  "insurance_provider": "string",
  "document_type": "provider_bill | hospital_statement | eob | denial_letter | itemized_statement",
  "documents": [                   // S3 references
    { "s3_key": "string", "filename": "string", "content_type": "string", "uploaded_at": "ISO date" }
  ],
  "parsing_status": "pending | processing | completed | failed",
  "confidence_scores": {
    "overall": Number,             // 0-1
    "fields": { "<field_name>": Number }
  },
  "plain_language_summary": "string",   // Gemini-generated
  "user_notes": "string",
  "created_at": "ISO date",
  "updated_at": "ISO date"
}
```

### 4.2 `line_items`

```jsonc
{
  "_id": ObjectId,
  "bill_id": ObjectId,
  "service_date": "ISO date",
  "description": "string",
  "code": "string",               // CPT / HCPCS / revenue code
  "code_type": "CPT | HCPCS | REV | ICD",
  "quantity": Number,
  "billed_amount": Number,
  "allowed_amount": Number,
  "insurance_paid": Number,
  "patient_responsibility": Number,
  "adjustment_reason": "string",
  "category": "facility | physician | lab | imaging | procedure | medication | supply | other",
  "confidence": Number,           // 0-1
  "risk_level": "normal | needs_review | high_risk",
  "flags": [                      // populated by error detection
    { "type": "string", "message": "string", "severity": "info | warning | critical" }
  ]
}
```

### 4.3 `benchmark_results`

```jsonc
{
  "_id": ObjectId,
  "line_item_id": ObjectId,
  "bill_id": ObjectId,
  "code": "string",
  "benchmark_source": "medicare_fee_schedule | hospital_transparency | regional_aggregate",
  "typical_low": Number,
  "typical_median": Number,
  "typical_high": Number,
  "billed_amount": Number,
  "deviation_percentage": Number,  // (billed - median) / median * 100
  "deviation_score": Number,       // 0-10 severity
  "risk_level": "normal | elevated | extreme"
}
```

### 4.4 `appeal_packets`

```jsonc
{
  "_id": ObjectId,
  "bill_id": ObjectId,
  "generation_date": "ISO date",
  "appeal_strategy": "string",
  "sections": {
    "bill_explanation": "string (markdown)",
    "flagged_issues": "string (markdown)",
    "benchmark_analysis": "string (markdown)",
    "insurance_insights": "string (markdown)",
    "appeal_letter": "string (markdown)",
    "coding_review_request": "string (markdown)",
    "negotiation_script": "string (markdown)",
    "evidence_checklist": ["string"]
  },
  "pdf_s3_key": "string",
  "status": "draft | finalized"
}
```

### 4.5 `call_logs`

```jsonc
{
  "_id": ObjectId,
  "bill_id": ObjectId,
  "started_at": "ISO date",
  "ended_at": "ISO date",
  "transcript": [
    { "role": "agent | representative", "text": "string", "timestamp": "ISO date" }
  ],
  "ai_responses": [
    { "prompt_context": "string", "response": "string", "timestamp": "ISO date" }
  ],
  "negotiation_outcome": "string",
  "notes": "string"
}
```

---

## 5. Backend API Endpoints

### 5.1 Document Management

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/bills/upload` | Upload bill / EOB files → S3 → trigger parsing pipeline. Accepts `multipart/form-data`. Returns `bill_id`. |
| `GET` | `/api/bills/:bill_id` | Get bill metadata + parsing status + summary. |
| `GET` | `/api/bills/:bill_id/line-items` | Get extracted line items with flags. |
| `POST` | `/api/bills/:bill_id/confirm-fields` | User confirms / corrects low-confidence fields. |

### 5.2 Analysis

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/bills/:bill_id/explanation` | Plain-language explanation (Gemini-generated). |
| `GET` | `/api/bills/:bill_id/errors` | Detected billing errors / flags. |
| `GET` | `/api/bills/:bill_id/benchmarks` | Benchmark comparison results for each line item. |
| `GET` | `/api/bills/:bill_id/insurance-insights` | Insurance rule matching results. |

### 5.3 Appeal Packet

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/bills/:bill_id/appeal-packet/generate` | Trigger Gemini to generate all appeal sections. Returns `packet_id`. |
| `GET` | `/api/appeal-packets/:packet_id` | Get packet sections (markdown). |
| `PUT` | `/api/appeal-packets/:packet_id` | Update/edit individual sections. |
| `GET` | `/api/appeal-packets/:packet_id/pdf` | Export as PDF. |

### 5.4 Call Assistant

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/calls/start` | Create call session, generate initial strategy + script. Returns `call_id`. |
| `WS` | `/api/calls/:call_id/stream` | WebSocket: send user/rep transcript chunks, receive AI responses + TTS audio. |
| `POST` | `/api/calls/:call_id/end` | End session, save transcript + outcome. |
| `GET` | `/api/calls/:call_id` | Get call log. |

---

## 6. Parsing Pipeline (Backend Detail)

The parsing pipeline executes as an async job triggered by `POST /api/bills/upload`:

```
Step 1 ─ Store file in S3
Step 2 ─ Send to AWS Textract (async)
         → Extract raw text blocks, tables, key-value pairs, layout
Step 3 ─ Document Classification (Gemini)
         → "Is this a provider bill, EOB, denial letter, or itemized statement?"
Step 4 ─ Structured Data Extraction (Gemini)
         → Given the Textract output + classification, extract into line_items schema
Step 5 ─ Confidence Scoring
         → Gemini self-rates certainty per field (high/medium/low)
Step 6 ─ Benchmarking (parallel)
         → For each CPT/HCPCS code, look up Medicare & transparency data
Step 7 ─ Error Detection (Gemini + rules)
         → Flag duplicates, mismatched dates, denied-billed, quantity issues
Step 8 ─ Insurance Rule Matching (Gemini)
         → Analyze for emergency protections, OON rules, appeal triggers
Step 9 ─ Plain-Language Summary (Gemini)
         → Generate patient-friendly explanation
Step 10 ─ Store all results in MongoDB
Step 11 ─ Update bill status to "completed"
```

### Gemini Prompt Templates

All Gemini interactions use structured system prompts. Key prompt areas:

1. **Document Classification Prompt**: Given OCR text, classify document type, output JSON.
2. **Structured Extraction Prompt**: Given OCR text + doc type, extract line items into schema, output JSON array.
3. **Plain-Language Explanation Prompt**: Given structured line items, write a friendly summary paragraph for each charge and the overall bill.
4. **Error Detection Prompt**: Given line items, apply rules (duplicates, date mismatches, denied-billed, quantity anomalies), output flagged items with reasons.
5. **Insurance Rule Matching Prompt**: Given line items + insurance info, identify applicable protections, appeal triggers, output insights.
6. **Appeal Letter Prompt**: Given flagged issues + benchmarks + insurance insights, draft a formal appeal letter.
7. **Negotiation Script Prompt**: Given all analysis, generate a step-by-step phone script with introduction, issue explanation, evidence references, escalation prompts, closing.

---

## 7. Frontend Page Specifications

### 7.1 Landing Page (`/`)

**Purpose**: Marketing hero page. Explain what BillClarity does. CTA to `/app`.

**Sections**:
- Hero with headline: "Understand. Challenge. Reduce." + animated medical bill illustration
- 3-column feature highlights (Upload → Analyze → Dispute)
- "How It Works" step-by-step (4 steps with icons)
- Social proof / stats (e.g., "Up to 30% of medical bills contain errors")
- CTA button → "Analyze Your Bill" → navigates to `/app`

**Design Notes**:
- Dark/navy gradient background, glassmorphism cards
- Smooth scroll animations via `motion`
- Use `lucide-react` icons throughout

---

### 7.2 App Layout (`/app`)

**Purpose**: Shared sidebar + content area for all logged-in pages.

**Sidebar Navigation Items** (top to bottom):
1. 📤 Upload — `/app`
2. 📋 Bill Overview — `/app/bill-overview`
3. 🔍 Analysis — `/app/analysis`
4. 📊 Benchmarking — `/app/benchmarking`
5. 🛡️ Insurance Insights — `/app/insurance-insights`
6. 📦 Appeal Packet — `/app/appeal-packet`
7. 📞 Call Assistant — `/app/call-assistant`

**Behavior**:
- Sidebar collapses on mobile (hamburger menu)
- Active route highlighted
- Progress indicator showing which steps are completed (grayed out if no bill uploaded yet)
- Sidebar shows bill summary (provider, date, total) once a bill is loaded

---

### 7.3 Upload Page (`/app` — index)

**Purpose**: File upload + optional context form.

**UI Elements**:
- Drag-and-drop zone (accepts PDF, PNG, JPG, HEIC)
- File previews with thumbnails after selection
- Optional context form:
  - Insurance Provider (text input)
  - Visit Type (dropdown: Emergency, Outpatient, Inpatient, Imaging, Other)
  - Suspected Issue (textarea)
  - Notes (textarea)
- "Analyze Bill" primary button
- Processing state: upload progress bar → "Extracting text..." → "Analyzing charges..." → "Detecting issues..." → redirect to `/app/bill-overview`

**API Calls**: `POST /api/bills/upload`, then poll `GET /api/bills/:bill_id` until `parsing_status === "completed"`.

---

### 7.4 Bill Overview Page (`/app/bill-overview`)

**Purpose**: Show parsed bill summary + plain-language explanation + visualizations.

**Sections**:

#### A. Bill Summary Card
- Provider, Facility, Service Date Range
- Total Billed / Insurance Allowed / Insurance Paid / Patient Owes
- Document type badge
- Overall confidence score (with tooltip explaining it)

#### B. Plain-Language Explanation
- Gemini-generated summary in a readable card
- Each charge group explained in simple terms
- Expandable for full detail

#### C. Line Items Table
- Sortable, filterable data table (use shadcn `Table` or MUI DataGrid)
- Columns: Date | Description | Code | Qty | Billed | Allowed | You Owe | Status
- Status column shows risk badge: ✅ Normal / ⚠️ Needs Review / 🔴 High Risk
- Click a row → drawer with full detail + flags + benchmark info

#### D. Bill Category Breakdown (Recharts)
- Donut/pie chart: charges grouped by category (facility, physician, lab, imaging, procedure, medication)

#### E. Payment Flow Visualization
- Horizontal stacked bar or Sankey diagram: Billed → Allowed → Insurance Paid → Patient Owes
- Shows where money "flows" and what gets adjusted

---

### 7.5 Analysis Page (`/app/analysis`)

**Purpose**: Error detection results + risk assessment.

**Sections**:

#### A. Issue Summary Cards
- Count badges: X Critical / Y Warnings / Z Info items
- Animated counters

#### B. Flagged Items List
- Card for each flagged line item:
  - Issue type icon + title (e.g., "Potential Duplicate Charge")
  - Affected line item reference
  - Severity badge
  - Gemini-generated explanation of WHY this is flagged
  - "Include in Appeal" toggle
- Filters: All | Critical | Warning | Info

#### C. Risk Heatmap
- Grid/table view where each line item is color-coded by risk level
- Hover for detail popover

#### D. Cross-Document Validation (if EOB uploaded)
- Side-by-side comparison: Bill vs EOB
- Highlighted mismatches (different totals, missing adjustments, date inconsistencies)

---

### 7.6 Benchmarking Page (`/app/benchmarking`)

**Purpose**: Price comparison against reference pricing data.

**Sections**:

#### A. Benchmark Summary
- "X of Y charges are above typical pricing"
- Total potential savings estimate

#### B. Benchmark Table
- For each line item with a valid code:
  - Code | Description | Billed | Medicare Rate | Typical Range | Deviation
  - Deviation shown as colored bar (green/yellow/red)

#### C. Deviation Chart (Recharts)
- Bar chart: each line item's billed amount vs. typical range (shown as error bars or range bands)
- Items sorted by deviation severity

#### D. Regional Context
- If available: "In your region, the typical cost for [service] is $X–$Y"
- Map or regional label

---

### 7.7 Insurance Insights Page (`/app/insurance-insights`)

**Purpose**: Insurance rule analysis + appeal opportunity detection.

**Sections**:

#### A. Applicable Protections
- Cards for each detected protection:
  - Title (e.g., "No Surprises Act — Emergency Billing Protection")
  - Plain-language explanation
  - How it applies to this bill
  - Strength indicator (strong / moderate / weak applicability)

#### B. Denial Analysis (if applicable)
- Denial code interpretation
- Common overturn reasons for this denial code
- Appeal success likelihood (qualitative: "Frequently overturned" / "Sometimes overturned" / "Rarely overturned")

#### C. Deductible / Copay Analysis
- Verify deductible application is correct
- Flag if deductible amount doesn't match plan terms user provided

#### D. Appeal Triggers
- List of specific reasons an appeal could succeed
- Each linked to supporting evidence from the bill

---

### 7.8 Appeal Packet Page (`/app/appeal-packet`)

**Purpose**: Generate, review, and export the dispute packet.

**Sections**:

#### A. Packet Builder
- Checklist of sections to include:
  - ☑ Bill Explanation Report
  - ☑ Flagged Issue Summary
  - ☑ Benchmark Analysis
  - ☑ Insurance Rule Insights
  - ☑ Formal Appeal Letter
  - ☑ Coding Review Request
  - ☑ Negotiation Script
  - ☑ Evidence Checklist
- "Generate Packet" button

#### B. Section Previews
- Tab view or accordion for each section
- Rendered markdown with edit capability (contenteditable or markdown editor)
- "Regenerate" button per section

#### C. Appeal Letter Preview
- Formatted letter preview with sender/recipient fields
- Date auto-filled
- Editable

#### D. Export Actions
- "Download PDF" — exports full bundle
- "Copy to Clipboard" — copies appeal letter text
- "Email Draft" — opens mailto: with pre-filled body (stretch goal)

---

### 7.9 Call Assistant Page (`/app/call-assistant`)

**Purpose**: AI-assisted phone negotiation interface.

**Sections**:

#### A. Pre-Call Setup
- Select dispute strategy (auto-suggested based on analysis)
- Review generated negotiation script
- Key talking points summary
- "Start Call Session" button

#### B. Active Call Interface
- Real-time transcript display (scrolling chat-style):
  - Agent (AI) messages in blue
  - Representative responses in gray (transcribed from speech)
- Current AI-suggested response card with "Speak" button (triggers ElevenLabs TTS)
- Manual override: text input to type custom response
- Contextual tips: floating cards with "If they say X, respond with Y"
- Escalation button: quick-inserts for escalation language

#### C. Call Controls
- 🔴 End Call
- ⏸️ Pause / Mute
- 📋 View Script (slide-over panel)
- 📊 Show Evidence (quick reference to benchmarks/flags)

#### D. Post-Call Summary
- Auto-generated call summary
- Outcome logging (resolved / escalated / follow-up needed)
- Transcript download
- Next steps recommendation

---

## 8. Synthetic Demo Data

Since the MVP uses anonymized data, the backend should ship with a pre-loaded demo scenario:

### Demo Bill: Emergency Room Visit

```
Provider: Metro General Hospital
Facility: Emergency Department
Date: 2026-02-15
Insurance: BlueCross BlueShield PPO

Line Items:
1. ER Facility Fee (REV 0450)          — $4,200.00
2. ER Physician Eval (CPT 99285)       — $1,850.00
3. CT Scan Abdomen (CPT 74177)         — $3,200.00
4. CT Scan Abdomen (CPT 74177)         — $3,200.00  ← DUPLICATE
5. CBC Blood Test (CPT 85025)          — $450.00
6. Metabolic Panel (CPT 80053)         — $380.00
7. IV Fluid Administration (CPT 96360) — $890.00
8. Acetaminophen 1000mg (HCPCS J0131)  — $75.00    ← OVERPRICED (typical: $2-5)
9. Saline Bag 1000mL (HCPCS A4217)     — $120.00   ← OVERPRICED (typical: $5-10)

Total Billed:    $14,365.00
Insurance Allowed: $6,420.00
Insurance Paid:   $4,620.00
Patient Balance:  $1,800.00
```

### Demo EOB (matching)

- Shows insurance processing with adjustments
- Has a missing adjustment for item #4 (duplicate not caught by insurer)
- Deductible of $500 applied
- Copay of $300 applied
- Remaining $1,000 applied to coinsurance

### Expected Flags

| Item | Flag | Severity |
|---|---|---|
| #4 CT Scan | Duplicate charge | Critical |
| #8 Acetaminophen | Extreme overpricing (1,400% above typical) | Critical |
| #9 Saline Bag | Extreme overpricing (1,100% above typical) | Critical |
| #1 ER Facility Fee | Above typical range (Medicare: ~$2,800) | Warning |
| #3 CT Scan | Above typical range (Medicare: ~$1,200) | Warning |

### Expected Insurance Insights

- No Surprises Act protections apply (ER visit)
- Balance billing restrictions may apply
- Duplicate charge appeal has high success likelihood

---

## 9. Benchmarking Data Strategy

For the MVP, use **static reference data** bundled with the backend:

| Source | Data |
|---|---|
| Medicare Physician Fee Schedule (MPFS) | CPT code → national average payment rate |
| Medicare Outpatient Prospective Payment | APC rates for facility fees |
| CMS Hospital Transparency | Sample pricing from publicly available hospital chargemasters |

Store as a JSON/CSV lookup table keyed by CPT/HCPCS code:

```jsonc
{
  "99285": { "description": "ER Visit Level 5", "medicare_rate": 432.00, "typical_low": 350, "typical_median": 800, "typical_high": 1500 },
  "74177": { "description": "CT Abdomen/Pelvis w/ Contrast", "medicare_rate": 269.00, "typical_low": 500, "typical_median": 1200, "typical_high": 2500 },
  // ...
}
```

---

## 10. AI Prompt Design (Gemini)

All prompts follow a structured format:

```
SYSTEM: You are a medical billing analyst AI. You help patients understand and dispute medical bills.

CONTEXT:
- Document type: {doc_type}
- Extracted line items: {line_items_json}
- Insurance info: {insurance_info}
- Benchmark data: {benchmark_results}

TASK: {specific_task_description}

OUTPUT FORMAT: {json_schema | markdown | structured_text}

CONSTRAINTS:
- Use plain language a patient can understand
- Be factual; cite specific codes, amounts, and rules
- Never provide legal advice; frame as "potential" issues to discuss
```

### Key Prompt Contracts

| Prompt | Input | Output |
|---|---|---|
| Classify Document | OCR text (first 4000 chars) | `{ "type": "provider_bill|eob|...", "confidence": 0.95 }` |
| Extract Line Items | OCR text + doc type | `[{ line_item schema }]` |
| Explain Bill | Structured line items | Markdown: patient-friendly explanation |
| Detect Errors | Line items array | `[{ "line_item_id", "type", "message", "severity" }]` |
| Match Insurance Rules | Line items + insurance info | `[{ "rule", "description", "applicability", "appeal_strategy" }]` |
| Generate Appeal Letter | All analysis results | Formal letter (markdown) |
| Generate Script | All analysis results | Step-by-step negotiation script (markdown) |
| Call Response | Transcript context + strategy | Next agent response text |

---

## 11. Call Assistant Architecture (Detailed)

### Flow

```
User clicks "Start Call Session"
     │
     ▼
Backend: Gemini generates strategy + opening script
     │
     ▼
Frontend: Displays script, user reads/speaks or AI speaks via ElevenLabs
     │
     ▼
┌──── CALL LOOP ────┐
│                    │
│  User/Rep speaks   │
│       │            │
│       ▼            │
│  STT transcribes   │
│       │            │
│       ▼            │
│  Transcript sent   │
│  to backend (WS)   │
│       │            │
│       ▼            │
│  Gemini generates  │
│  next response     │
│       │            │
│       ▼            │
│  Response sent     │
│  to frontend (WS)  │
│       │            │
│       ▼            │
│  ElevenLabs TTS    │
│  plays audio       │
│       │            │
│       ▼            │
│  Loop continues    │
└────────────────────┘
     │
     ▼
User clicks "End Call"
     │
     ▼
Backend: Save transcript + generate summary
```

### MVP Simplification

For the hackathon demo, the call assistant can be **simulated**:
- Pre-scripted representative responses (a few scenarios)
- User types responses instead of speech
- AI generates text responses (no actual TTS needed if time-constrained)
- Full ElevenLabs integration is a stretch goal

---

## 12. PDF Export Specification

The appeal packet PDF should contain:

1. **Cover Page**: "Medical Billing Dispute Packet" + patient info + date + bill reference
2. **Table of Contents**
3. **Bill Explanation Report**: Plain-language summary of all charges
4. **Flagged Issues**: Each issue with severity, explanation, affected line item
5. **Benchmark Analysis**: Table of charges vs. typical pricing + deviation chart
6. **Insurance Rule Insights**: Applicable protections and appeal triggers
7. **Formal Appeal Letter**: Ready-to-send letter with all details
8. **Coding Review Request**: Letter requesting itemized coding review
9. **Negotiation Script**: Phone script with talking points
10. **Evidence Checklist**: What documents to gather/attach

Generate client-side using `@react-pdf/renderer` or server-side using a templating engine.

---

## 13. Design System & UI Direction

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#2563EB` (Blue 600) | CTAs, active states, links |
| `--primary-dark` | `#1D4ED8` | Hover states |
| `--accent` | `#10B981` (Emerald 500) | Success, safe indicators |
| `--warning` | `#F59E0B` (Amber 500) | Warning badges, "needs review" |
| `--danger` | `#EF4444` (Red 500) | Critical flags, errors |
| `--bg-dark` | `#0F172A` (Slate 900) | Dark mode background |
| `--bg-card` | `#1E293B` (Slate 800) | Card backgrounds (dark mode) |
| `--text-primary` | `#F8FAFC` | Primary text (dark mode) |
| `--text-muted` | `#94A3B8` | Secondary text |

### Typography

- **Headings**: Inter / Outfit (Google Fonts), bold
- **Body**: Inter, regular, 14-16px
- **Monospace**: JetBrains Mono (for codes, amounts)

### Component Style

- Glass morphism cards with backdrop-blur
- Subtle gradient borders
- Micro-animations on interactions (scale, opacity transitions via `motion`)
- Smooth page transitions
- Sonner toasts for status updates
- Skeleton loaders during data fetching

---

## 14. MVP Demo Flow (Step-by-Step)

This is the exact sequence for the hackathon demo:

| Step | Action | Page | What the Audience Sees |
|---|---|---|---|
| 1 | Open app | `/` | Beautiful landing page with "Understand. Challenge. Reduce." |
| 2 | Click "Analyze Your Bill" | `/app` | Upload interface |
| 3 | Upload demo ER bill PDF | `/app` | Processing animation with status steps |
| 4 | View parsed bill | `/app/bill-overview` | Summary card, plain-language explanation, line items table, category donut chart, payment flow |
| 5 | Click suspicious charge | `/app/bill-overview` | Drawer opens showing the $3,200 duplicate CT scan flagged in red |
| 6 | Navigate to Analysis | `/app/analysis` | 3 critical + 2 warning flags displayed, risk heatmap |
| 7 | Navigate to Benchmarking | `/app/benchmarking` | Acetaminophen at 1,400% above typical, deviation chart |
| 8 | Navigate to Insurance Insights | `/app/insurance-insights` | No Surprises Act protection, appeal triggers |
| 9 | Navigate to Appeal Packet | `/app/appeal-packet` | Generate appeal → preview sections → download PDF |
| 10 | Navigate to Call Assistant | `/app/call-assistant` | Start simulated call → AI generates responses → show conversation flow |
| 11 | Export full dispute packet | `/app/appeal-packet` | PDF downloaded with all sections |

---

## 15. Development Phases

### Phase 1 — Frontend Polish (Priority: High)
- [ ] Finalize Landing Page design with animations
- [ ] Build complete `AppLayout` sidebar with progress tracking
- [ ] Build Upload Page with drag-drop + processing states
- [ ] Build Bill Overview with all visualizations
- [ ] Build Analysis Page with flags + risk heatmap
- [ ] Build Benchmarking Page with charts
- [ ] Build Insurance Insights Page
- [ ] Build Appeal Packet Page with section builder + PDF export
- [ ] Build Call Assistant Page (simulated mode)

### Phase 2 — Backend Core (Priority: High)
- [ ] Set up API server (Node/Express or Python/FastAPI)
- [ ] S3 upload integration
- [ ] AWS Textract integration
- [ ] Gemini integration (all prompt pipelines)
- [ ] MongoDB CRUD operations
- [ ] Parsing pipeline orchestration
- [ ] Benchmark data loading

### Phase 3 — Integration (Priority: High)
- [ ] Connect frontend to backend APIs
- [ ] End-to-end upload → parse → display flow
- [ ] Appeal packet generation + PDF export
- [ ] Call assistant WebSocket flow (or simulated)

### Phase 4 — Polish & Demo Prep (Priority: Medium)
- [ ] Load synthetic demo data
- [ ] Smooth all animations and transitions
- [ ] Error handling and edge cases
- [ ] Demo script rehearsal

### Stretch Goals
- [ ] ElevenLabs voice integration for call assistant
- [ ] n8n orchestration for call workflow
- [ ] Appeal success probability scoring
- [ ] Multi-bill analysis
- [ ] Financial assistance program detection

---

## 16. Environment Variables

```env
# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=billclarity-docs

# Google AI
GEMINI_API_KEY=

# MongoDB
MONGODB_URI=mongodb+srv://...

# ElevenLabs (stretch)
ELEVENLABS_API_KEY=

# n8n (stretch)
N8N_WEBHOOK_URL=

# Server
PORT=3001
NODE_ENV=development
```

---

## 17. Key Constraints & Decisions

1. **No authentication** — MVP is single-user, session-scoped.
2. **Synthetic data only** — No real PHI. Demo uses fabricated bills.
3. **Client-side PDF generation** — Avoids server-side rendering complexity.
4. **Gemini 2.0 Flash** — Fastest model for real-time interactions.
5. **Static benchmark data** — No live API calls to CMS; pre-bundled lookup tables.
6. **Call assistant MVP is simulated** — Text-based chat simulating a call; full voice is a stretch goal.
7. **TailwindCSS 4** — Already configured; use throughout.
8. **shadcn/ui + Radix** — Primary component library; MUI only for DataGrid if needed.

---

*This document is the single source of truth for building BillClarity. All implementation decisions should reference this plan.*
