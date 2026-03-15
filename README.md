# BillClarity — AI-Powered Medical Bill Dispute Automation

> **Stop overpaying. Understand your bill. Fight back with AI.**

Medical debt is the leading cause of personal bankruptcy in the United States. Industry estimates suggest that **20–30% of medical bills contain errors** — duplicate charges, unbundled procedures, upcoded services, incorrect quantities — yet fewer than **5% of patients ever dispute their bills**. The ones who do successfully reduce their charges by an average of **30–50%**.

BillClarity closes that gap. It's an end-to-end AI platform that takes a patient from *"I don't understand this bill"* to *"Here's my formal dispute, and here's exactly what to say on the phone."*

---

## Inspiration

The gap between patients and billing departments isn't willingness — it's knowledge. A single ER visit can generate a bill with 15–30 line items full of CPT codes, HCPCS codes, ICD-10 diagnoses, contractual adjustments, and denial reason codes. Patients don't know what to look for, what evidence to gather, how to write an appeal letter, what consumer protections apply to them, or what to say when they call the billing department.

We built BillClarity to answer one question: **what if AI could read your medical bill the way a professional medical billing advocate would — and then hand you everything you need to fight it?**

---

## What It Does

### 1. Upload & Parse
Upload any medical bill or Explanation of Benefits (PDF, image). AWS Textract extracts text and tables via OCR; AWS Comprehend Medical identifies medications, procedures, and diagnoses with standardized codes (ICD-10-CM, RxNorm).

### 2. AI Analysis
Google Gemini classifies the document, extracts structured line items with confidence scores, and generates a plain-language summary explaining every charge.

### 3. Error Detection
A dual-layer system catches billing mistakes:
- **Rule-based**: duplicate charges, quantity anomalies, date mismatches, denied-but-billed services
- **AI-augmented**: Gemini reasons about clinical plausibility, unbundling, hidden fees, and unusual combinations

### 4. Cost Benchmarking
Every billing code is compared against Medicare reimbursement rates and typical commercial insurance pricing. For a charge billed at $b$ against a typical median of $m$, we compute:

$$\text{deviation} = \frac{b - m}{m} \times 100\%$$

Charges are classified as *normal*, *elevated*, or *extreme* based on a 0–10 severity scale.

### 5. Insurance Insights
Gemini matches the bill against federal protections (No Surprises Act), state billing regulations, and common appeal triggers, estimating success likelihood for each strategy.

### 6. Appeal Packet Generation
The system automatically generates a complete dispute packet:
- Plain-language bill explanation
- Flagged billing issues (severity-sorted)
- Benchmark pricing comparison table
- Insurance rule analysis
- Formal appeal letter (with evidence references)
- Phone negotiation script (step-by-step dialogue)

Everything is exportable as PDF — individual sections or a full bundle.

### 7. AI Voice Call Assistant
Our signature feature. A real-time AI call companion that helps patients negotiate with billing departments over the phone. The patient types what the representative says; the AI generates strategic, firm-but-respectful responses informed by the full bill analysis. Responses are synthesized into natural speech via ElevenLabs TTS. The system maintains context across multiple calls on the same bill, learns from prior outcomes, and knows when to escalate.

---

## How We Built It

### Frontend
- **React 18 + TypeScript + Vite** for a fast, type-safe SPA
- **Tailwind CSS 4** for styling, **Radix UI** for accessible primitives
- **Recharts** for data visualization (benchmark comparisons, risk mapping)
- **React Markdown** for rendering AI-generated content with proper formatting
- Custom hooks (`useAnalysis`, `useAppealPacket`, `useCallSession`, `useFileUpload`) encapsulate all async data flows with independent error handling — one failing endpoint never blocks the others

### Backend
- **FastAPI** (Python, async) serving REST endpoints and WebSocket connections
- **Motor** (async MongoDB driver) for non-blocking database operations
- **14-step parsing pipeline** orchestrated in `parsing_pipeline.py`, supporting both local (BackgroundTasks) and AWS Lambda execution modes

### AI & ML Services
- **AWS Textract** — OCR with table and key-value pair extraction. Handles multi-page documents via async polling
- **AWS Comprehend Medical** — Medical NLP that normalizes entities to ICD-10-CM and RxNorm codes, enriching Gemini's context for more accurate code identification
- **Google Gemini 2.5 Flash** — The reasoning engine behind document classification, line item extraction, error detection, insurance matching, appeal generation, and real-time call responses. We use structured prompts loaded from template files (`backend/prompts/*.txt`) with temperature tuning per task (0.2 for analysis, 0.3 for conversation)
- **ElevenLabs** — Text-to-speech synthesis for the voice call assistant, using the `eleven_turbo_v2` model for low-latency audio generation

### Data & Storage
- **MongoDB Atlas** — Five collections: `bills`, `line_items`, `benchmark_results`, `appeal_packets`, `call_logs`
- **AWS S3** — Document storage for uploaded bills
- **Static benchmark JSON** — Pre-populated CPT and HCPCS pricing data (40 common codes) with Gemini as an intelligent fallback for unknown codes

### Infrastructure
- **Vultr VPS** — Production server running Uvicorn (backend) and serving the static frontend build
- **AWS Lambda + SQS** — Optional serverless pipeline mode for production-scale OCR processing

### Architecture

```
User → React SPA → FastAPI (REST + WebSocket)
                        ↓
            ┌───────────┼───────────┐
        Textract    Comprehend   Gemini 2.5
         (OCR)    Medical (NLP)   (AI)
            └───────────┼───────────┘
                        ↓
                    MongoDB Atlas
                   (bills, items,
                benchmarks, appeals,
                    call logs)
```

---

## Challenges We Faced

**Gemini JSON truncation.** Gemini's responses were getting cut off mid-JSON when `max_output_tokens` was set too low (1024), causing `JSONDecodeError: Unterminated string` crashes downstream. We bumped the limit to 2048 and built a JSON repair layer that closes unterminated strings and braces, with a regex fallback to extract partial responses:

```python
if repaired.count('"') % 2 != 0:
    repaired += '"'
open_braces = repaired.count("{") - repaired.count("}")
repaired += "}" * max(0, open_braces)
```

**Voice bot repetition loops.** The AI call assistant would sometimes repeat the same message endlessly. We traced this to three independent causes: (1) abandoned call sessions with null outcomes were polluting the "prior calls" context, (2) the anti-repetition prompt instructions were too weak, and (3) when Gemini failed, a hardcoded fallback message played on repeat. We fixed all three — filtering prior calls to only completed sessions, strengthening prompt guardrails, and replacing the static fallback with dynamic context-aware responses.

**`Promise.all` cascading failures.** The frontend fetched four analysis endpoints (explanation, errors, benchmarks, insurance insights) via `Promise.all`. If *any single endpoint* failed — even one the user wasn't looking at — the entire analysis page showed nothing. We replaced this with independent settlement so each endpoint succeeds or fails on its own:

```typescript
const settle = <T,>(p: Promise<T>) =>
  p.then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error }),
  );
```

**Mic flickering during calls.** The Web Speech API's `onend` event fires when background noise causes false starts. Our handler toggled `setListening(false)` then immediately restarted recognition, causing a visible flicker. We fixed it by checking *intent to restart* before toggling state — if we're about to restart anyway, skip the intermediate `false`.

**Benchmark coverage gaps.** Our initial static database only covered 11 billing codes. Any code not in the JSON was silently skipped, making the benchmarking page show all zeros for most real bills. We expanded to 40 common codes and added Gemini as an intelligent fallback — unknown codes are batched to the AI for estimated pricing based on CMS fee schedule knowledge, so every line item gets benchmarked.

---

## What We Learned

- **Medical billing is a domain where AI genuinely levels the playing field.** The knowledge asymmetry between patients and billing departments is enormous. A system that can read a bill, know what Medicare pays, and generate a dispute letter removes the single biggest barrier to patients fighting back.
- **Dual-layer detection matters.** Rule-based checks catch the obvious errors (duplicates, quantity anomalies) instantly and reliably. AI catches the subtle ones (clinical implausibility, unbundling, hidden fees). Neither alone is sufficient.
- **Resilient frontends require independent error boundaries.** Coupling unrelated API calls in a single `Promise.all` is a footgun — one bad endpoint shouldn't take down an entire page.
- **LLM output is inherently unreliable at the format level.** You need repair layers, fallbacks, and graceful degradation. Never assume the model will return valid JSON.
- **Voice AI is a UX challenge, not just a tech challenge.** Getting the tone right — firm enough to negotiate, respectful enough not to alienate the rep, flexible enough to accept new information — required multiple prompt iterations and real conversation testing.

---

## What's Next

- **EOB cross-referencing** — Automatically compare the provider bill against the insurance EOB to catch discrepancies between what was billed, what was allowed, and what was passed to the patient
- **Multi-bill tracking** — Dashboard view across all bills with aggregate savings tracking
- **Automated call execution** — Full voice-to-voice calling where the AI speaks directly to billing departments (currently the patient relays messages)
- **State-specific legal databases** — Deeper integration with state-level billing protection laws for more targeted appeal strategies

---

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your keys
uvicorn main:app --reload --port 8000
```

### Environment Variables

The backend requires the following in `.env`:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `S3_BUCKET_NAME` | S3 bucket for document storage |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API key |
| `PIPELINE_MODE` | `local` or `aws` |

---

## Project Structure

```
BillClarity/
├── src/                        # React frontend
│   └── app/
│       ├── pages/              # Page components
│       ├── components/         # UI + feature components
│       ├── services/           # API clients
│       ├── hooks/              # Custom React hooks
│       ├── types/              # TypeScript type definitions
│       └── context/            # React context (bill state)
├── backend/                    # FastAPI backend
│   ├── routers/                # API route handlers
│   ├── services/               # Business logic (12 service modules)
│   ├── prompts/                # Gemini prompt templates
│   ├── data/                   # Benchmark pricing JSON
│   ├── db/                     # MongoDB connection + repositories
│   ├── models/                 # Pydantic schemas
│   ├── utils/                  # Textract parser, PDF builder
│   └── lambda/                 # AWS Lambda handler
└── prdplan.md                  # Full product requirements
```

---

## Built With

`react` `typescript` `tailwindcss` `vite` `fastapi` `python` `mongodb` `aws-textract` `aws-comprehend-medical` `aws-s3` `aws-lambda` `google-gemini` `elevenlabs` `websockets` `weasyprint` `radix-ui` `recharts`
