# BillClarity Appeals Engine — Technical Product Requirements Document

> AI Medical Bill Intelligence + Dispute Automation Platform

---

## 1. Executive Summary

BillClarity is a patient-facing AI platform that analyzes medical bills and insurance explanations of benefits (EOBs), identifies potential billing errors or overpricing, benchmarks charges against healthcare pricing data, detects insurance rule mismatches, and generates structured appeal packets.

The system also includes an AI-assisted negotiation call agent that can help conduct disputes with insurance companies or billing departments.

BillClarity produces the following tangible outputs:

- Plain-language bill explanation
- Bill visualization and risk mapping
- Cost benchmarking analysis
- Billing error detection results
- Insurance rule matching insights
- Dispute packet generation (exportable PDF bundle)
- Negotiation call scripts
- AI-assisted call workflow with real-time voice synthesis

The goal is to help patients understand, challenge, and reduce medical bills through AI-powered analysis and dispute automation.

---

## 2. Problem Statement

Medical billing in the United States is complex, opaque, and error-prone.

**Lack of transparency.** Medical bills contain technical procedure codes (CPT, HCPCS, ICD-10), revenue codes, insurer adjustment reason codes, and contractual write-offs that most patients cannot interpret. A single emergency room visit can generate a bill with 15–30 line items across multiple providers, each with separate billing logic.

**High error rates.** Industry estimates suggest 20–30% of medical bills contain mistakes. Common errors include duplicate charges, unbundled procedures, upcoded services, incorrect quantities, and charges for denied services passed to the patient. These errors are rarely caught because patients do not know what to look for.

**Complex appeals process.** Even when patients suspect an error, they rarely dispute charges because they do not know:

- What specific errors to identify in their bills
- What evidence to collect and present
- How to structure a formal appeal letter
- What insurance rules or consumer protections apply to their situation
- What to say when calling billing departments or insurers
- How to escalate when initial requests are denied

**Financial impact.** Medical debt is the leading cause of personal bankruptcy in the United States. Patients who do dispute bills successfully reduce their charges by an average of 30–50%, but fewer than 5% of patients attempt to do so.

BillClarity solves these problems by providing AI-powered billing analysis, automated error detection, dispute document generation, and AI-assisted phone negotiation tools.

---

## 3. Product Vision

BillClarity aims to become a consumer-grade medical billing intelligence system that enables patients to:

1. **Understand** their medical bills in plain language without needing medical billing expertise.
2. **Detect** billing errors, pricing anomalies, and insurance processing mistakes through automated analysis.
3. **Compare** their charges to typical healthcare prices using public pricing data and Medicare fee schedules.
4. **Identify** insurance appeal opportunities based on consumer protection rules, denial patterns, and billing regulations.
5. **Generate** structured dispute documentation ready to submit to providers or insurers.
6. **Negotiate** directly with billing departments or insurers using AI-assisted call scripts and real-time voice support.

The platform should make the entire process from "I received a confusing bill" to "I submitted a dispute and negotiated a reduction" achievable in a single session.

---

## 4. Target Users

### Primary Users: Individual Patients

Patients who receive medical bills including:

- Hospital inpatient bills
- Emergency room bills
- Outpatient facility bills
- Physician/specialist invoices
- Imaging and radiology charges
- Laboratory billing statements
- Surgical procedure bills
- Physical therapy or rehabilitation charges

The system supports all billing types. The MVP demo focuses on a representative emergency room scenario.

### Secondary Users (Future)

- Patient advocacy groups assisting uninsured or underinsured patients
- Community healthcare programs helping patients navigate billing
- Financial counselors at hospitals or nonprofit organizations
- Legal aid organizations handling medical debt cases

---

## 5. Core Features

### 5.1 Document Upload and Intake

Users upload documents through the web interface. Supported document types:

- Medical bills (provider bills, hospital statements)
- Insurance Explanations of Benefits (EOBs)
- Itemized billing statements
- Insurance denial letters
- Scanned or photographed billing documents

Accepted file formats: PDF, PNG, JPG, HEIC.

**Optional context fields** provided by the user at upload time:

| Field | Type | Purpose |
|---|---|---|
| Insurance Provider | Text input | Used for insurance rule matching |
| Visit Type | Dropdown (Emergency, Outpatient, Inpatient, Imaging, Other) | Guides analysis strategy |
| Suspected Issue | Textarea | Helps AI focus on user concern |
| Notes | Textarea | Additional context about the encounter |

Documents are stored in AWS S3 and queued for the parsing pipeline.

---

### 5.2 Document Parsing Pipeline

Medical billing documents vary widely in structure, layout, terminology, and format. BillClarity uses a multi-layer parsing pipeline to convert arbitrary billing documents into structured, analyzable data.

#### Layer 1 — Document Storage

Uploaded files are stored in **AWS S3** with unique keys. Metadata (filename, content type, upload timestamp, associated user session) is recorded in MongoDB.

#### Layer 2 — OCR and Layout Extraction

**AWS Textract** processes the stored document and extracts:

- Raw text blocks with bounding box coordinates
- Table structures (rows, columns, cell values)
- Key-value pairs (e.g., "Total Due: $1,450.00")
- Document layout information (headers, sections, page structure)

Textract is invoked asynchronously. The backend polls for completion or uses SNS notification.

#### Layer 3 — Document Classification

**Google Gemini** receives the Textract output and classifies the document into one of the following types:

| Document Type | Description |
|---|---|
| `provider_bill` | Bill from a physician, specialist, or medical group |
| `hospital_statement` | Facility bill from a hospital or health system |
| `eob` | Insurance Explanation of Benefits |
| `denial_letter` | Insurance claim denial notification |
| `itemized_statement` | Detailed line-item breakdown of charges |

The classification includes a confidence score. Low-confidence classifications are flagged for user confirmation.

#### Layer 4 — Structured Data Extraction

**Gemini** extracts key fields from the Textract output into the standardized data schema:

- Provider name and facility
- Service dates (individual and range)
- Billing codes (CPT, HCPCS, revenue codes, ICD-10 diagnosis codes)
- Service descriptions
- Quantities
- Billed amounts
- Insurer allowed amounts
- Insurance payments
- Adjustments and write-offs
- Patient responsibility amounts
- Denial codes and reasons (if present)

Each field is extracted with reference to its source location in the document.

#### Layer 5 — LLM Normalization

Gemini normalizes the extracted data into the canonical schema defined in Section 8 (Data Model). This includes:

- Standardizing code formats (e.g., removing hyphens, normalizing CPT modifiers)
- Resolving ambiguous descriptions to standard terminology
- Calculating derived fields (e.g., total billed, total patient responsibility)
- Mapping line items to billing categories (facility, physician, lab, imaging, procedure, medication, supply)

#### Layer 6 — Confidence Scoring

Each extracted field receives a confidence classification:

| Level | Meaning | Action |
|---|---|---|
| High (0.85–1.0) | Field was clearly readable and unambiguous | Used directly |
| Medium (0.6–0.84) | Field was partially readable or required inference | Highlighted for optional user review |
| Low (0.0–0.59) | Field was unclear, missing, or conflicting | Flagged for user confirmation |

Low-confidence fields are surfaced in the UI with a prompt for the user to verify or correct.

#### Layer 7 — Cross-Document Validation

When both a bill and an EOB are uploaded for the same visit, the system compares them to identify inconsistencies:

- **Total mismatches**: Bill total differs from EOB total
- **Missing adjustments**: Bill shows a charge the EOB does not reference
- **Date inconsistencies**: Service dates differ between documents
- **Code discrepancies**: Billing codes differ between bill and EOB
- **Payment calculation errors**: Insurance paid + patient responsibility ≠ allowed amount

Cross-document mismatches are flagged as potential errors in the Analysis stage.

---

### 5.3 Plain-Language Bill Explanation

**Gemini** converts the structured billing data into patient-readable explanations. The explanation covers:

**Per-line-item explanations:**
> "This charge ($1,850.00) is for an emergency room physician evaluation at the highest complexity level (CPT 99285). This means the doctor assessed you as having a severe or life-threatening condition. Your insurance reduced this to $832.00 (the allowed amount) and paid $632.00. The remaining $200.00 was applied to your deductible."

**Overall bill summary:**
> "You visited the Emergency Department at Metro General Hospital on February 15, 2026. You received a physician evaluation, a CT scan of your abdomen, blood tests, IV fluids, and medications. The hospital billed $14,365.00 total. Your insurance negotiated this down to $6,420.00 and paid $4,620.00. You are responsible for $1,800.00, which includes your $500 deductible, $300 copay, and $1,000 in coinsurance."

The explanation helps users understand:
- What each service was and why it was performed
- How insurance processed each charge (allowed vs. billed)
- Why the patient owes the remaining balance
- What deductible, copay, and coinsurance mean in their specific case

---

### 5.4 Bill Visualization Engine

BillClarity provides four types of visual representation for billing data.

#### A. Bill Category Breakdown

A donut or pie chart grouping charges by category:

- Facility fees
- Physician fees
- Laboratory tests
- Imaging (radiology, CT, MRI)
- Procedures
- Medications
- Supplies
- Other

Each segment shows the dollar amount and percentage of total.

#### B. Payment Flow Visualization

A horizontal stacked bar or Sankey-style diagram showing the financial flow for the entire bill:

```
Provider Billed ($14,365) → Insurance Allowed ($6,420) → Insurance Paid ($4,620) → Patient Owes ($1,800)
                          ↘ Adjustment/Write-off ($7,945)
```

This visually demonstrates where the money goes: what was written off, what insurance covered, and what the patient must pay.

#### C. Risk Heatmap

A grid or table view where each line item is color-coded by its assessed risk level:

| Color | Level | Meaning |
|---|---|---|
| Green | Normal | Charge appears typical and correctly billed |
| Yellow | Needs Review | Charge has a minor anomaly or is slightly above benchmarks |
| Red | High Risk | Charge has a significant anomaly, is an extreme outlier, or has a detected error |

Hovering or clicking a cell shows the specific reason for the risk classification.

#### D. Benchmark Deviation Charts

Bar charts showing each line item's billed amount compared to the typical pricing range. The chart displays:

- A point for the billed amount
- A shaded range band for the typical low–high range
- A line for the Medicare reference rate

Items are sorted by deviation severity (worst outliers first).

---

### 5.5 Benchmarking Engine

BillClarity compares each billed charge against reference pricing data to identify overpricing.

#### Data Sources

| Source | Content | Usage |
|---|---|---|
| Medicare Physician Fee Schedule (MPFS) | CPT code → national average Medicare payment | Baseline "floor" reference |
| Medicare Outpatient Prospective Payment System (OPPS) | APC rates for facility services | Facility fee benchmarks |
| CMS Hospital Price Transparency Data | Publicly reported hospital chargemaster rates | Regional price comparisons |
| Regional healthcare pricing datasets | Aggregated commercial payer rates by region | "Typical" commercially insured pricing |

For the MVP, benchmark data is stored as a static JSON lookup table keyed by CPT/HCPCS code:

```json
{
  "99285": {
    "description": "ER Visit Level 5",
    "medicare_rate": 432.00,
    "typical_low": 350.00,
    "typical_median": 800.00,
    "typical_high": 1500.00
  },
  "74177": {
    "description": "CT Abdomen/Pelvis with Contrast",
    "medicare_rate": 269.00,
    "typical_low": 500.00,
    "typical_median": 1200.00,
    "typical_high": 2500.00
  }
}
```

#### Benchmarking Output

For each line item with a recognized billing code, the engine calculates:

- **Deviation percentage**: `(billed_amount - typical_median) / typical_median × 100`
- **Deviation score**: 0–10 numeric severity score
- **Risk level**: `normal` (within typical range), `elevated` (above typical but not extreme), `extreme` (far outside typical range)

The engine specifically flags:

- Charges exceeding the typical high range by more than 50%
- Charges exceeding the Medicare rate by more than 500%
- Common items (medications, supplies) billed at extreme markups

---

### 5.6 Billing Error Detection

The system identifies potential billing errors using a combination of rule-based logic and Gemini AI reasoning.

#### Rule-Based Checks

| Error Type | Detection Logic |
|---|---|
| Duplicate charges | Two or more line items with identical CPT/HCPCS codes on the same date of service |
| Quantity anomalies | Quantities that are unusually high for the service type (e.g., 5 units of an ER physician evaluation) |
| Date mismatches | Service dates on the bill that fall outside the stated visit date range |
| Denied-but-billed | Services marked as denied by insurance but still included in the patient balance |
| Missing adjustments | Charges on the bill that do not appear on the EOB, or vice versa |
| Unbundled procedures | Multiple procedure codes billed separately that should be covered by a single bundled code |

#### AI-Augmented Reasoning

Gemini analyzes the full set of line items and identifies:

- Charges that seem clinically implausible given the visit type
- Unusual combinations of services
- Services typically included in facility fees but billed separately
- Charges that appear to be administrative fees rather than clinical services

Each detected issue includes:

- **Issue type** (e.g., "Duplicate Charge")
- **Affected line item(s)** with references
- **Severity** (Critical / Warning / Info)
- **Explanation** of why this was flagged, written in patient-friendly language
- **Suggested action** (e.g., "Request itemized review", "Include in appeal letter")

---

### 5.7 Insurance Rule Matching

The system analyzes billing data against known insurance rules and consumer protection patterns to identify potential appeal strategies.

#### Analysis Areas

**Emergency billing protections:**
- No Surprises Act provisions for emergency services
- State-level emergency billing protections
- Balance billing restrictions for emergency care

**Out-of-network scenarios:**
- No Surprises Act out-of-network protections
- State balance billing laws
- Network adequacy issues

**Denial code interpretation:**
- Common denial reason codes and their meanings
- Overturn rates for specific denial codes
- Required appeal formats for specific denial types

**Deductible and cost-sharing validation:**
- Verify deductible amounts match plan terms
- Check coinsurance percentages against plan documentation
- Identify potential copay miscalculations

**Appeal trigger identification:**
- Specific conditions where appeals have high success rates
- Regulatory requirements that strengthen appeal arguments
- Documentation requirements for specific appeal types

#### Output Format

Each insurance insight includes:

- **Rule or protection name** (e.g., "No Surprises Act — Emergency Services")
- **Plain-language description** of the rule
- **How it applies** to this specific bill
- **Applicability strength** (Strong / Moderate / Weak)
- **Suggested appeal strategy** if applicable

---

### 5.8 Appeal Packet Generator

BillClarity generates a structured dispute packet containing all the documentation needed to file a billing dispute or insurance appeal.

#### Packet Sections

| Section | Content |
|---|---|
| Bill Explanation Report | Plain-language summary of all charges, how insurance processed them, and what the patient owes |
| Flagged Issue Summary | List of all detected errors and anomalies with severity ratings and explanations |
| Benchmark Comparison Report | Table showing each charge compared to typical pricing, with deviation analysis |
| Insurance Rule Insights | Applicable consumer protections and appeal triggers |
| Formal Appeal Letter | Ready-to-send letter addressed to the billing department or insurer, citing specific issues, relevant regulations, and requested actions |
| Coding Review Request | Formal request for an itemized coding review, citing specific codes under dispute |
| Negotiation Script | Step-by-step phone script for calling the billing department |
| Evidence Checklist | List of supporting documents the patient should gather (e.g., EOB, plan summary, prior authorization records) |

#### Generation Process

1. User selects which sections to include (all selected by default)
2. User clicks "Generate Appeal Packet"
3. Backend sends all analysis data to Gemini with section-specific prompts
4. Gemini generates each section as structured markdown
5. Sections are returned to the frontend for preview and editing
6. User can edit any section inline
7. User can regenerate individual sections
8. User exports the final packet as a PDF bundle

#### PDF Export

The exported PDF includes:

1. Cover page with patient info, bill reference, and date
2. Table of contents
3. All selected sections formatted for print
4. Appendix with supporting charts and data tables

---

### 5.9 Negotiation Script Generation

Gemini generates a detailed, situation-specific phone negotiation script. The script is structured in sequential sections:

#### Script Sections

1. **Introduction and Identity Verification**
   - Who to ask for (billing department, appeals department, supervisor)
   - How to identify yourself and reference the account
   - Opening statement establishing the purpose of the call

2. **Issue Explanation**
   - Clear description of each billing issue in non-technical terms
   - Specific dollar amounts and codes referenced
   - Connection to supporting evidence

3. **Supporting Evidence Presentation**
   - Medicare rates for the billed services
   - Typical pricing ranges
   - Specific error descriptions
   - Applicable consumer protection rules

4. **Specific Request**
   - Itemized coding review request
   - Specific dollar adjustment requested
   - Appeal filing request

5. **Escalation Prompts**
   - What to say if the representative cannot help
   - How to request a supervisor or appeals specialist
   - How to request the call be documented in the account

6. **Closing Statements**
   - Requesting written confirmation of any agreements
   - Obtaining reference numbers for the call
   - Setting follow-up expectations

---

### 5.10 AI-Assisted Negotiation Call Agent

BillClarity supports AI-assisted phone negotiations through a real-time call assistant interface.

#### Call Workflow (Detailed)

```
Step 1 — Pre-Call Preparation
├── Gemini generates negotiation strategy based on all analysis results
├── Gemini generates the initial call script
├── Key talking points and evidence are summarized
└── User reviews strategy and script before starting

Step 2 — Call Session Start
├── User initiates call session from the Call Assistant interface
├── n8n creates a new call session and initializes state
└── Opening script is displayed and optionally spoken via ElevenLabs TTS

Step 3 — Active Call Loop
│
├── A) User/Representative speaks
│   ├── Audio is captured via browser microphone
│   └── Speech-to-text service transcribes audio to text
│
├── B) Transcript is sent to backend
│   ├── n8n receives the transcript segment via webhook
│   └── Transcript is appended to the call session state
│
├── C) Gemini generates next response
│   ├── n8n sends the full conversation context + analysis data to Gemini
│   ├── Gemini generates the next recommended response
│   └── Response includes both the text and strategic notes (e.g., "escalate if denied")
│
├── D) Response is delivered to the user
│   ├── Text response is displayed in the call interface
│   ├── ElevenLabs converts response to speech audio
│   └── Audio is played through the user's device
│
└── E) Loop continues until user ends the call

Step 4 — Post-Call Processing
├── Full transcript is saved to MongoDB
├── Gemini generates a call summary and outcome assessment
├── Next steps are recommended (e.g., "Follow up in 5 business days if no response")
└── Transcript is available for download
```

#### n8n Orchestration Responsibilities

n8n manages the following workflow nodes:

- **Session management**: Create, track, and close call sessions
- **Transcript routing**: Receive transcribed text and route to Gemini
- **AI response generation**: Send context to Gemini and receive responses
- **Voice synthesis coordination**: Send AI responses to ElevenLabs for TTS
- **Event logging**: Record all events (transcript segments, AI responses, user actions) in MongoDB
- **Error handling**: Detect and recover from API failures during active calls

#### MVP Simplification

For the hackathon demo, the call assistant operates in **simulated mode**:

- Pre-scripted representative responses for the demo scenario
- User types responses instead of using live speech
- AI generates text responses displayed on screen
- No actual ElevenLabs TTS or live STT required
- Full voice integration is a documented stretch goal

---

## 6. Technology Architecture

### 6.1 Frontend — Base44

**Base44** powers the frontend web application.

Responsibilities:

- Complete user interface and page routing
- Document upload interface with drag-and-drop support
- Bill visualization dashboards (charts, tables, heatmaps)
- Appeal packet preview, editing, and export
- Call assistant chat-style interface
- Processing state indicators and progress animations
- Responsive layout for desktop and tablet

The application does **not** require user authentication for the hackathon MVP.

### 6.2 Backend API — Vultr Compute

**Vultr Compute** hosts the backend API server and processing services.

Responsibilities:

- REST API endpoints for all frontend interactions
- WebSocket endpoint for real-time call assistant communication
- Document parsing pipeline orchestration
- Integration with AWS services (S3, Textract)
- Integration with Google Gemini API
- Integration with MongoDB Atlas
- Benchmark data lookups
- PDF generation for appeal packets
- Request validation and error handling

The backend runs as a single deployable service (Node.js/Express or Python/FastAPI) on a Vultr compute instance.

### 6.3 Document Storage — AWS S3

**AWS S3** stores all uploaded documents and generated files.

Stored objects:

- Original uploaded bills and EOBs (PDF, PNG, JPG, HEIC)
- Generated appeal packet PDFs
- Textract output artifacts (if cached)

Objects are keyed by `{session_id}/{document_type}/{timestamp}_{filename}`.

### 6.4 OCR and Table Extraction — AWS Textract

**AWS Textract** extracts text and structured data from uploaded billing documents.

Capabilities used:

- **DetectDocumentText**: Raw text extraction with bounding boxes
- **AnalyzeDocument (Tables)**: Table structure extraction with row/column/cell identification
- **AnalyzeDocument (Forms)**: Key-value pair extraction (e.g., "Patient Name: John Doe")

Textract processes documents asynchronously. The backend submits a job, polls for completion, and retrieves results.

### 6.5 AI Reasoning Layer — Google Gemini API

**Google Gemini API** (Gemini 2.0 Flash) performs all AI reasoning tasks.

| Task | Input | Output |
|---|---|---|
| Document classification | Textract raw text (first 4000 chars) | Document type + confidence score |
| Structured data extraction | Textract output + document type | Array of line items in schema format |
| Confidence scoring | Extracted fields + source text | Per-field confidence ratings |
| Plain-language explanation | Structured line items + insurance info | Patient-readable markdown |
| Error detection | Line items array + cross-document data | Flagged issues with severity and explanations |
| Insurance rule matching | Line items + insurance info + visit type | Applicable rules and appeal strategies |
| Benchmark interpretation | Line items + benchmark lookup results | Risk assessments and outlier analysis |
| Appeal letter generation | All analysis results | Formal appeal letter in markdown |
| Negotiation script generation | All analysis results | Structured phone script in markdown |
| Real-time call response | Conversation transcript + strategy context | Next recommended response |

Gemini 2.0 Flash is selected for its fast response times, which are critical for the real-time call assistant and interactive UI.

### 6.6 Database — MongoDB Atlas

**MongoDB Atlas** stores all structured application data.

MongoDB's document model is well-suited for medical billing data because:

- Bill structures vary widely between providers and facilities
- Line items have variable fields depending on the document type
- Analysis results are nested and hierarchical
- The schema needs to accommodate partial data from low-confidence extractions

Collections are described in Section 8 (Data Model).

### 6.7 Workflow Orchestration — n8n

**n8n** (self-hosted on Vultr) orchestrates the AI-assisted call workflow.

n8n is used specifically for the call assistant because the call workflow requires:

- Stateful session management across multiple async events
- Sequential orchestration of multiple API calls (STT → Gemini → ElevenLabs)
- Error recovery and retry logic for real-time interactions
- Event logging at each workflow step

n8n workflows:

1. **Call Session Init**: Create session → generate strategy (Gemini) → return script
2. **Transcript Processing**: Receive transcript → append to context → generate AI response (Gemini) → synthesize speech (ElevenLabs) → return audio + text
3. **Call End**: Save final transcript → generate summary (Gemini) → log outcome

### 6.8 Voice Synthesis — ElevenLabs

**ElevenLabs** converts AI-generated text responses into natural-sounding speech during call sessions.

- Uses the streaming TTS API for low-latency audio generation
- Voice is configured for professional, calm, and clear articulation
- Audio is streamed back to the frontend via WebSocket

### 6.9 Speech Transcription

Live call audio is transcribed into text for AI analysis.

- Browser captures microphone audio via `MediaRecorder` API
- Audio is sent to a speech-to-text service (ElevenLabs STT, Deepgram, or Web Speech API)
- Transcribed text is routed through n8n to Gemini for response generation

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Base44)                            │
│  Upload UI · Bill Dashboard · Analysis · Benchmarks · Appeal ·     │
│  Call Assistant                                                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST API / WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend API (Vultr Compute)                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ Upload &     │  │ Analysis     │  │ Appeal Packet          │    │
│  │ Parsing      │  │ Engine       │  │ Generator              │    │
│  │ Pipeline     │  │              │  │                        │    │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬───────────┘    │
│         │                 │                       │                 │
└─────────┼─────────────────┼───────────────────────┼─────────────────┘
          │                 │                       │
    ┌─────▼─────┐     ┌────▼────┐            ┌─────▼──────┐
    │  AWS S3   │     │ Google  │            │  MongoDB   │
    │ (storage) │     │ Gemini  │            │  Atlas     │
    └─────┬─────┘     │ API     │            │ (database) │
          │           └─────────┘            └────────────┘
    ┌─────▼─────┐
    │   AWS     │
    │ Textract  │
    │  (OCR)    │
    └───────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              Call Assistant Workflow (n8n on Vultr)                  │
│                                                                     │
│  Browser Mic → Speech-to-Text → n8n Webhook                        │
│       ↓                            ↓                                │
│  Transcript appended          Gemini generates                      │
│  to call context              next response                        │
│       ↓                            ↓                                │
│  ElevenLabs TTS ←─────── Response text                              │
│       ↓                                                             │
│  Audio streamed to frontend                                         │
│       ↓                                                             │
│  Loop continues until call ends                                     │
│       ↓                                                             │
│  Transcript + outcome saved to MongoDB                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. API Endpoints

### 7.1 Document Management

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/bills/upload` | Upload bill/EOB files. Accepts `multipart/form-data` (files + optional context fields). Stores files in S3, creates bill record in MongoDB, triggers parsing pipeline. Returns `{ bill_id, status: "processing" }`. |
| `GET` | `/api/bills/:bill_id` | Get bill metadata, parsing status, and summary. Frontend polls this until `parsing_status === "completed"`. |
| `GET` | `/api/bills/:bill_id/line-items` | Get all extracted line items with flags and confidence scores. |
| `POST` | `/api/bills/:bill_id/confirm-fields` | User confirms or corrects low-confidence fields. Body: `{ field_corrections: [{ line_item_id, field, corrected_value }] }`. |

### 7.2 Analysis

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/bills/:bill_id/explanation` | Get the Gemini-generated plain-language explanation. |
| `GET` | `/api/bills/:bill_id/errors` | Get all detected billing errors and flags. |
| `GET` | `/api/bills/:bill_id/benchmarks` | Get benchmark comparison results for each line item. |
| `GET` | `/api/bills/:bill_id/insurance-insights` | Get insurance rule matching results and appeal strategies. |

### 7.3 Appeal Packet

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/bills/:bill_id/appeal-packet/generate` | Trigger Gemini to generate all selected appeal sections. Body: `{ sections: ["bill_explanation", "flagged_issues", ...] }`. Returns `{ packet_id }`. |
| `GET` | `/api/appeal-packets/:packet_id` | Get all packet sections (markdown content). |
| `PUT` | `/api/appeal-packets/:packet_id` | Update edited sections. Body: `{ sections: { section_name: "updated markdown" } }`. |
| `GET` | `/api/appeal-packets/:packet_id/pdf` | Generate and return the PDF bundle. |

### 7.4 Call Assistant

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/calls/start` | Create a new call session. Gemini generates strategy and opening script. Body: `{ bill_id }`. Returns `{ call_id, strategy, script }`. |
| `WS` | `/api/calls/:call_id/stream` | WebSocket for real-time call interaction. Client sends transcript segments; server responds with AI-generated text and optional audio URLs. |
| `POST` | `/api/calls/:call_id/end` | End the call session. Gemini generates summary and outcome. Returns `{ summary, outcome, next_steps }`. |
| `GET` | `/api/calls/:call_id` | Get the complete call log (transcript, AI responses, outcome). |

---

## 8. Data Model

All collections are stored in MongoDB Atlas. Schemas use a document-oriented structure to accommodate the variable nature of medical billing data.

### 8.1 `bills`

```json
{
  "_id": "ObjectId",
  "user_id": "string — session-scoped identifier",
  "provider": "string — provider or hospital name",
  "facility": "string — facility or department name",
  "visit_type": "string — ER | outpatient | inpatient | imaging | other",
  "service_date_range": {
    "start": "ISO 8601 date",
    "end": "ISO 8601 date"
  },
  "total_billed": "number — sum of all billed amounts",
  "total_allowed": "number — sum of insurance allowed amounts",
  "total_insurance_paid": "number — total insurance payment",
  "patient_balance": "number — total patient responsibility",
  "insurance_provider": "string — name of insurance company",
  "document_type": "string — provider_bill | hospital_statement | eob | denial_letter | itemized_statement",
  "documents": [
    {
      "s3_key": "string — S3 object key",
      "filename": "string — original filename",
      "content_type": "string — MIME type",
      "uploaded_at": "ISO 8601 datetime"
    }
  ],
  "parsing_status": "string — pending | processing | completed | failed",
  "confidence_scores": {
    "overall": "number — 0.0 to 1.0",
    "fields": {
      "provider": "number",
      "total_billed": "number",
      "patient_balance": "number"
    }
  },
  "plain_language_summary": "string — Gemini-generated explanation",
  "user_notes": "string — optional notes provided at upload",
  "created_at": "ISO 8601 datetime",
  "updated_at": "ISO 8601 datetime"
}
```

### 8.2 `line_items`

```json
{
  "_id": "ObjectId",
  "bill_id": "ObjectId — reference to bills collection",
  "service_date": "ISO 8601 date",
  "description": "string — service description from the bill",
  "code": "string — CPT, HCPCS, or revenue code",
  "code_type": "string — CPT | HCPCS | REV | ICD",
  "quantity": "number",
  "billed_amount": "number",
  "allowed_amount": "number — insurance allowed amount",
  "insurance_paid": "number",
  "patient_responsibility": "number",
  "adjustment_reason": "string — reason for any adjustment",
  "category": "string — facility | physician | lab | imaging | procedure | medication | supply | other",
  "confidence": "number — 0.0 to 1.0 field extraction confidence",
  "risk_level": "string — normal | needs_review | high_risk",
  "flags": [
    {
      "type": "string — duplicate | overpriced | date_mismatch | denied_billed | quantity_anomaly | unbundled",
      "message": "string — patient-friendly explanation",
      "severity": "string — info | warning | critical",
      "suggested_action": "string"
    }
  ]
}
```

### 8.3 `benchmark_results`

```json
{
  "_id": "ObjectId",
  "line_item_id": "ObjectId — reference to line_items collection",
  "bill_id": "ObjectId — reference to bills collection",
  "code": "string — CPT or HCPCS code",
  "benchmark_source": "string — medicare_fee_schedule | hospital_transparency | regional_aggregate",
  "medicare_rate": "number — Medicare payment rate",
  "typical_low": "number — low end of typical pricing range",
  "typical_median": "number — median typical price",
  "typical_high": "number — high end of typical pricing range",
  "billed_amount": "number — amount charged on the bill",
  "deviation_percentage": "number — percentage above/below median",
  "deviation_score": "number — 0 to 10 severity score",
  "risk_level": "string — normal | elevated | extreme"
}
```

### 8.4 `appeal_packets`

```json
{
  "_id": "ObjectId",
  "bill_id": "ObjectId — reference to bills collection",
  "generation_date": "ISO 8601 datetime",
  "appeal_strategy": "string — summary of the dispute strategy",
  "sections": {
    "bill_explanation": "string — markdown content",
    "flagged_issues": "string — markdown content",
    "benchmark_analysis": "string — markdown content",
    "insurance_insights": "string — markdown content",
    "appeal_letter": "string — markdown content",
    "coding_review_request": "string — markdown content",
    "negotiation_script": "string — markdown content",
    "evidence_checklist": ["string — checklist items"]
  },
  "selected_sections": ["string — which sections the user chose to include"],
  "pdf_s3_key": "string — S3 key for generated PDF, null if not yet exported",
  "status": "string — generating | draft | finalized"
}
```

### 8.5 `call_logs`

```json
{
  "_id": "ObjectId",
  "bill_id": "ObjectId — reference to bills collection",
  "started_at": "ISO 8601 datetime",
  "ended_at": "ISO 8601 datetime or null if active",
  "strategy": "string — Gemini-generated negotiation strategy",
  "initial_script": "string — opening negotiation script",
  "transcript": [
    {
      "role": "string — agent | representative | system",
      "text": "string — spoken or typed text",
      "timestamp": "ISO 8601 datetime"
    }
  ],
  "ai_responses": [
    {
      "prompt_context": "string — what context was sent to Gemini",
      "response": "string — Gemini-generated response",
      "timestamp": "ISO 8601 datetime"
    }
  ],
  "negotiation_outcome": "string — resolved | escalated | follow_up | unresolved | null",
  "summary": "string — AI-generated call summary",
  "next_steps": "string — recommended follow-up actions",
  "notes": "string — user-added notes"
}
```

---

## 9. Gemini Prompt Architecture

All Gemini interactions use structured prompts with a consistent format:

```
SYSTEM: You are a medical billing analyst AI. You help patients
understand and dispute medical bills. You are factual, precise,
and use plain language.

CONTEXT:
- Document type: {doc_type}
- Extracted text/data: {extracted_data}
- Insurance information: {insurance_info}
- Benchmark data: {benchmark_results}
- Prior analysis: {analysis_context}

TASK: {specific_task_description}

OUTPUT FORMAT: {json_schema | markdown | structured_text}

CONSTRAINTS:
- Use plain language a patient without medical training can understand
- Be factual; cite specific codes, amounts, dates, and rules
- Never provide legal advice; frame findings as "potential" issues
- When uncertain, state the uncertainty explicitly
```

### Prompt Contracts

| Prompt | Input | Output Format |
|---|---|---|
| Classify Document | Textract raw text (first 4000 chars) | JSON: `{ "type": "...", "confidence": 0.95 }` |
| Extract Line Items | Textract output + classified doc type | JSON array of line item objects matching schema |
| Score Confidence | Extracted fields + source text | JSON: per-field confidence scores |
| Explain Bill | Structured line items + insurance data | Markdown: per-charge explanation + overall summary |
| Detect Errors | Line items array + cross-doc data | JSON array: `[{ "line_item_id", "type", "message", "severity", "suggested_action" }]` |
| Match Insurance Rules | Line items + insurance info + visit type | JSON array: `[{ "rule", "description", "applicability", "strength", "appeal_strategy" }]` |
| Interpret Benchmarks | Line items + benchmark lookup data | JSON array: risk assessments per line item |
| Generate Appeal Letter | All analysis results | Markdown: formal letter |
| Generate Coding Review Request | Flagged coding issues | Markdown: formal request letter |
| Generate Negotiation Script | All analysis results | Markdown: structured script with sections |
| Generate Call Response | Full transcript + strategy + analysis data | Text: next recommended response + strategic notes |
| Summarize Call | Full transcript + outcome | Markdown: call summary + next steps |

---

## 10. Synthetic Demo Data

The MVP uses fabricated, anonymized billing data. No real protected health information (PHI) is used.

### Demo Scenario: Emergency Room Visit

**Patient context:** Patient visited the emergency department with acute abdominal pain. Received evaluation, CT imaging, blood work, IV fluids, and medications.

**Demo Bill:**

```
Provider:       Metro General Hospital
Facility:       Emergency Department
Date of Service: 2026-02-15
Insurance:      BlueCross BlueShield PPO

Line Items:
 #  Code         Description                        Qty   Billed
 1  REV 0450     ER Facility Fee                     1    $4,200.00
 2  CPT 99285    ER Physician Eval (Level 5)         1    $1,850.00
 3  CPT 74177    CT Abdomen/Pelvis w/ Contrast       1    $3,200.00
 4  CPT 74177    CT Abdomen/Pelvis w/ Contrast       1    $3,200.00  ← DUPLICATE
 5  CPT 85025    CBC Blood Test                      1      $450.00
 6  CPT 80053    Comprehensive Metabolic Panel       1      $380.00
 7  CPT 96360    IV Fluid Administration             1      $890.00
 8  HCPCS J0131  Acetaminophen Injection 1000mg      1       $75.00  ← OVERPRICED
 9  HCPCS A4217  Saline Bag 1000mL                   1      $120.00  ← OVERPRICED

Total Billed:           $14,365.00
Insurance Allowed:       $6,420.00
Insurance Paid:          $4,620.00
Patient Balance:         $1,800.00
```

**Demo EOB (matching):**

- Shows insurance processing with adjustments for each line item
- Adjustment/write-off of $7,945.00 (difference between billed and allowed)
- Duplicate CT scan (#4) was NOT caught by the insurer — still included in allowed amount
- Deductible applied: $500.00
- Copay applied: $300.00
- Coinsurance (20%): $1,000.00

### Expected Detection Results

| Item | Flag Type | Severity | Explanation |
|---|---|---|---|
| #4 CT Scan | Duplicate charge | Critical | Identical CPT 74177 billed twice on same date — likely a billing error |
| #8 Acetaminophen | Extreme overpricing | Critical | Billed at $75.00; typical cost is $2–$5.00 (1,400% above typical) |
| #9 Saline Bag | Extreme overpricing | Critical | Billed at $120.00; typical cost is $5–$10.00 (1,100% above typical) |
| #1 ER Facility Fee | Above typical range | Warning | Billed at $4,200; Medicare rate ~$2,800; typical range $2,500–$4,000 |
| #3 CT Scan | Above typical range | Warning | Billed at $3,200; Medicare rate ~$269; typical range $500–$2,500 |

### Expected Insurance Insights

- **No Surprises Act**: Emergency services are protected under the No Surprises Act — balance billing restrictions apply
- **Duplicate charge appeal**: High success likelihood — clear billing error with identical codes on same date
- **Overpriced supplies appeal**: Moderate success — common hospital markup practice, but extreme cases can be disputed

### Expected Benchmark Highlights

| Code | Billed | Medicare Rate | Typical Median | Deviation |
|---|---|---|---|---|
| 99285 | $1,850.00 | $432.00 | $800.00 | +131% |
| 74177 | $3,200.00 | $269.00 | $1,200.00 | +167% |
| J0131 | $75.00 | $0.25 | $3.00 | +2,400% |
| A4217 | $120.00 | $1.50 | $7.00 | +1,614% |

---

## 11. Security Considerations

Medical billing documents contain sensitive personal and health information. The following security measures apply:

### Data Handling

- **Encrypted storage**: All documents in S3 use server-side encryption (AES-256 via SSE-S3)
- **Encrypted transit**: All API communication uses HTTPS/TLS
- **Session-scoped data**: MVP uses transient session identifiers; no persistent user accounts
- **No PHI in logs**: Application logs exclude document content, billing amounts, and personal identifiers

### Access Control

- **S3 bucket policy**: Private bucket with access restricted to the backend API's IAM role
- **MongoDB network access**: Atlas cluster restricted to Vultr compute instance IP
- **API rate limiting**: Basic rate limiting to prevent abuse

### MVP-Specific Notes

- The hackathon MVP uses **synthetic/anonymized billing data only**
- No real patient data is uploaded or stored during the demo
- Authentication is not implemented for the MVP; all access is anonymous and session-scoped
- Production deployment would require HIPAA-compliant infrastructure, user authentication, audit logging, and data retention policies

---

## 12. MVP Scope

The hackathon MVP includes the following features in a fully functional state:

| Feature | MVP Scope |
|---|---|
| Document upload | Upload PDF/image files with optional context fields |
| Parsing pipeline | S3 storage → Textract OCR → Gemini classification → structured extraction → confidence scoring |
| Bill explanation | Gemini-generated plain-language explanation of all charges |
| Bill visualization | Category breakdown chart, payment flow diagram, risk heatmap |
| Benchmarking | Comparison against static Medicare/transparency data, deviation charts |
| Error detection | Rule-based + AI-powered flag detection with severity ratings |
| Insurance insights | Insurance rule matching with appeal strategy suggestions |
| Appeal packet | Generate all sections, preview, edit, and export as PDF |
| Call assistant | Simulated mode — text-based chat with Gemini-generated responses |

### Out of MVP Scope (Stretch Goals)

| Feature | Status |
|---|---|
| ElevenLabs voice synthesis in call assistant | Stretch — documented architecture, not implemented |
| Live speech-to-text transcription | Stretch — browser-based fallback possible |
| n8n orchestration for call workflow | Stretch — simulated via direct API calls in MVP |
| Appeal success probability scoring | Stretch |
| Multi-bill analysis (aggregate across visits) | Stretch |
| Automated financial assistance detection | Stretch |
| Expanded benchmark datasets (regional, payer-specific) | Stretch |
| User authentication and persistent accounts | Stretch |

---

## 13. Demo Flow

The following is the step-by-step demo scenario for presenting BillClarity at the hackathon. Each step maps to a specific system capability.

| Step | User Action | System Response | Key Feature Demonstrated |
|---|---|---|---|
| 1 | Open the application | Landing page loads with product overview and CTA | Frontend, branding |
| 2 | Click "Analyze Your Bill" | Navigate to upload interface | Navigation |
| 3 | Upload demo ER bill (PDF) and EOB | Files uploaded to S3, parsing pipeline begins. Progress indicators show: "Uploading..." → "Extracting text..." → "Classifying document..." → "Analyzing charges..." → "Detecting issues..." | Upload, S3, Textract, Gemini pipeline |
| 4 | View parsed bill overview | Summary card shows provider, dates, totals. Plain-language explanation describes each charge. Line items table displays all 9 charges with risk badges. | Parsing, explanation, structured extraction |
| 5 | View bill visualizations | Category donut chart shows charge distribution. Payment flow shows billed → allowed → paid → patient owes. Risk heatmap highlights the 3 critical and 2 warning items. | Visualization engine |
| 6 | Click on the flagged duplicate CT scan | Detail drawer opens showing: identical codes on same date, "Critical: Potential duplicate charge", suggested action to request coding review. | Error detection |
| 7 | Navigate to Analysis page | Full list of 5 flagged issues with severity, explanations, and suggested actions. Cross-document validation shows the EOB did not catch the duplicate. | Error detection, cross-document validation |
| 8 | Navigate to Benchmarking page | Deviation chart shows acetaminophen at 2,400% above Medicare rate. Table compares all charges to typical ranges. Total potential savings estimated. | Benchmarking engine |
| 9 | Navigate to Insurance Insights page | No Surprises Act emergency protections identified. Duplicate charge appeal strategy with "high success likelihood" rating. | Insurance rule matching |
| 10 | Navigate to Appeal Packet page | All 8 sections available. Click "Generate Appeal Packet". Preview each section — appeal letter cites specific codes, amounts, and regulations. | Appeal packet generation |
| 11 | Navigate to Call Assistant page | Review negotiation strategy and script. Start simulated call. AI generates contextual responses as the user plays through a billing dispute scenario. | Call assistant, Gemini reasoning |
| 12 | Export dispute packet | Download PDF bundle containing all appeal sections, benchmark charts, and supporting evidence. | PDF export |

---

## 14. Expected Impact

BillClarity addresses a systemic problem affecting millions of patients. The platform's potential impact includes:

**For individual patients:**
- Understand complex medical bills without specialized knowledge
- Identify billing errors that would otherwise go undetected
- Dispute charges with professional-quality documentation
- Negotiate more effectively with structured scripts and AI assistance
- Reduce out-of-pocket medical costs

**For healthcare system transparency:**
- Surface pricing inconsistencies through benchmarking
- Hold providers accountable for billing accuracy
- Encourage adoption of transparent pricing practices

**For broader adoption:**
- Patient advocacy groups could use BillClarity to assist clients at scale
- Community health programs could offer billing review services
- Financial counselors could generate dispute documentation faster
- Legal aid organizations could build cases around documented billing errors

**Quantitative potential:**
- If 20–30% of bills contain errors, and BillClarity helps patients identify and dispute them, the per-patient savings could range from hundreds to thousands of dollars per dispute
- The average successful hospital bill negotiation reduces charges by 30–50%
- Scaling to even a small percentage of the ~1 billion medical bills issued annually in the US represents significant aggregate savings

---

*This document serves as the complete technical specification for building BillClarity. Engineers should reference this PRD for all architectural decisions, feature requirements, data models, and API contracts.*
