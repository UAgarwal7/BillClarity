# BillClarity — Backend Implementation PRD

> Server-side specification derived from `prdplan.md`. Reference for all API, infrastructure, and pipeline decisions.

---

## 1. Runtime & Framework

| Decision | Choice | Rationale |
|---|---|---|
| Language | Python 3.11+ | boto3, motor, google-generativeai ecosystem |
| Framework | FastAPI | Async, OpenAPI docs, WebSocket built-in |
| Server | Uvicorn | Production ASGI |
| Async Tasks | FastAPI `BackgroundTasks` | Pipeline runs after upload returns |

---

## 2. Project Structure

```
backend/
├── main.py                        # App entry, CORS, lifespan
├── config.py                      # Env vars, settings
├── requirements.txt
├── routers/
│   ├── bills.py                   # /api/bills/*
│   ├── analysis.py                # explanation, errors, benchmarks, insights
│   ├── appeal_packets.py          # /api/appeal-packets/*
│   └── calls.py                   # /api/calls/* + WebSocket
├── services/
│   ├── upload_service.py          # S3 upload, bill record creation
│   ├── parsing_pipeline.py        # Full parse orchestration
│   ├── textract_service.py        # AWS Textract calls
│   ├── gemini_service.py          # All Gemini interactions
│   ├── benchmark_service.py       # Code lookup + deviation calc
│   ├── error_detection_service.py # Rule-based + AI flags
│   ├── insurance_service.py       # Rule matching
│   ├── appeal_service.py          # Packet generation
│   ├── pdf_service.py             # markdown → HTML → PDF
│   └── call_service.py            # Call session management
├── models/                        # Pydantic schemas
│   ├── bill.py
│   ├── line_item.py
│   ├── benchmark.py
│   ├── appeal_packet.py
│   ├── call_log.py
│   └── common.py
├── db/
│   ├── connection.py              # motor AsyncIOMotorClient
│   └── repositories.py            # CRUD per collection
├── data/
│   ├── benchmark_cpt.json         # CPT → pricing
│   ├── benchmark_hcpcs.json       # HCPCS → pricing
│   └── demo_bill.json             # Pre-loaded demo data
├── prompts/                       # Gemini prompt templates (.txt)
│   ├── classify_document.txt
│   ├── extract_line_items.txt
│   ├── explain_bill.txt
│   ├── detect_errors.txt
│   ├── match_insurance_rules.txt
│   ├── generate_appeal_letter.txt
│   ├── generate_negotiation_script.txt
│   └── generate_call_response.txt
└── utils/
    ├── s3.py
    ├── textract_parser.py
    └── pdf_builder.py
```

---

## 3. Infrastructure

### Vultr Compute

- 2 vCPU, 4 GB RAM minimum, Ubuntu 22.04
- Run: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Production: gunicorn + uvicorn workers behind nginx with SSL

### AWS S3

- Bucket: `billclarity-docs`, region `us-east-1`, SSE-S3 encryption, private access
- Key format: `{session_id}/uploads/{timestamp}_{filename}` and `{session_id}/packets/{packet_id}.pdf`
- CORS: allow Base44 frontend origin

### AWS Textract

- Use `AnalyzeDocument` (sync, single-page) or `StartDocumentAnalysis` (async, multi-page)
- Features: `TABLES`, `FORMS`
- Input: S3 object reference

### MongoDB Atlas

- Cluster: M0 Free Tier, database `billclarity`
- Driver: `motor` (async)
- Collections: `bills`, `line_items`, `benchmark_results`, `appeal_packets`, `call_logs`

**Indexes:**
```
bills: [user_id, parsing_status]
line_items: [bill_id]
benchmark_results: [bill_id, line_item_id]
appeal_packets: [bill_id]
call_logs: [bill_id]
```

---

## 4. API Endpoints — Full Contracts

### 4.1 `POST /api/bills/upload`

Accepts `multipart/form-data`: `files` (required, max 10 MB each), `insurance_provider`, `visit_type` (enum), `suspected_issue`, `notes`.

**Flow:** Upload files to S3 → create bill record (status: `processing`) → trigger `run_parsing_pipeline` in background → return `bill_id`.

**Response 201:**
```json
{ "bill_id": "660a...", "status": "processing" }
```

### 4.2 `GET /api/bills/:bill_id`

Returns bill metadata + parsing status. Frontend polls every 2s until `parsing_status` is `completed` or `failed`.

**Response 200:** Full bill object (provider, facility, totals, confidence_scores, plain_language_summary, parsing_status).

### 4.3 `GET /api/bills/:bill_id/line-items`

Returns `{ line_items: [...], total_count: N }`. Each item includes code, amounts, category, confidence, risk_level, and `flags` array.

### 4.4 `POST /api/bills/:bill_id/confirm-fields`

Body: `{ field_corrections: [{ line_item_id?, field, corrected_value }] }`. Updates MongoDB docs; optionally re-triggers benchmark for corrected codes.

### 4.5 `GET /api/bills/:bill_id/explanation`

Returns `{ overall_summary, line_item_explanations: [{ line_item_id, explanation }] }`.

### 4.6 `GET /api/bills/:bill_id/errors`

Returns `{ error_summary: { critical, warning, info }, errors: [...], cross_document_issues: [...] }`. Each error has type, message, severity, suggested_action, affected_amount.

### 4.7 `GET /api/bills/:bill_id/benchmarks`

Returns `{ summary: { items_above_typical, estimated_savings_low/high }, benchmarks: [...] }`. Each benchmark has code, billed_amount, medicare_rate, typical range, deviation_percentage, deviation_score, risk_level.

### 4.8 `GET /api/bills/:bill_id/insurance-insights`

Returns `{ insights: [{ rule, description, applicability, strength, appeal_strategy }], appeal_triggers: [{ trigger, success_likelihood, reasoning }] }`.

### 4.9 `POST /api/bills/:bill_id/appeal-packet/generate`

Body: `{ sections: ["bill_explanation", "flagged_issues", ...] }`. Fetches all analysis → sends each section to Gemini → stores in `appeal_packets`. Returns `{ packet_id, status: "generating" }`.

### 4.10 `GET /api/appeal-packets/:packet_id`

Returns full packet with all sections as markdown strings + status (`generating | draft | finalized`).

### 4.11 `PUT /api/appeal-packets/:packet_id`

Body: `{ sections: { section_name: "updated markdown" } }`. Saves user edits.

### 4.12 `GET /api/appeal-packets/:packet_id/pdf`

Generates PDF: markdown → HTML (markdown2) → PDF (weasyprint). Uploads to S3, returns download or presigned URL.

### 4.13 `POST /api/calls/start`

Body: `{ bill_id }`. Gemini generates strategy + opening script. Creates call_log. Returns `{ call_id, strategy, opening_script, key_points }`.

### 4.14 `WS /api/calls/:call_id/stream`

Client sends: `{ type: "transcript", role: "representative", text: "..." }`.
Server responds: `{ type: "ai_response", text: "...", strategic_note: "..." }`.
MVP: text only, no audio_url.

### 4.15 `POST /api/calls/:call_id/end`

Gemini summarizes full transcript. Returns `{ summary, outcome, next_steps }`.

### 4.16 `GET /api/calls/:call_id`

Returns full call_log (transcript, ai_responses, outcome).

---

## 5. Parsing Pipeline Implementation

Async flow triggered by upload:

```
1. Run Textract on each S3 document
2. Extract raw text + tables from Textract response
3. Gemini: classify document type (→ JSON: type + confidence)
4. Gemini: extract structured line items (→ JSON array)
5. Store line items in MongoDB
6. Benchmark lookup: for each code, query static JSON data, calculate deviation
7. Store benchmark results in MongoDB
8. Error detection: run rule-based checks (duplicates, quantity, dates) + Gemini reasoning
9. Update line items with flags and risk_level
10. Gemini: match insurance rules (→ JSON array of insights)
11. Gemini: generate plain-language explanation (→ markdown)
12. Calculate totals, update bill status to "completed"
```

On failure: set `parsing_status: "failed"` with error message.

### Rule-Based Error Detection

| Rule | Logic |
|---|---|
| Duplicate charges | Count (code, date) pairs; flag if count > 1 |
| Quantity anomaly | Flag if qty > 3 for physician/facility categories |
| Extreme overpricing | Flag if deviation_score ≥ 8 from benchmark results |
| Date mismatch | Flag if line item date outside bill's service_date_range |
| Denied-but-billed | Flag if item has denial code but nonzero patient_responsibility |

After rule checks, send full item list to Gemini for additional AI-detected anomalies.

### Benchmark Scoring

```
deviation_pct = (billed - typical_median) / typical_median × 100

Score mapping:
  ≤0%   → 0    ≤50%  → 2    ≤100% → 4
  ≤200% → 6    ≤500% → 8    >500% → 10

Risk: 0-3 = normal, 4-6 = elevated, 7-10 = extreme
```

---

## 6. Error Handling

Consistent format across all endpoints:

```json
{ "error": { "code": "BILL_NOT_FOUND", "message": "...", "status": 404 } }
```

| Code | Status | Meaning |
|---|---|---|
| `BILL_NOT_FOUND` | 404 | Invalid bill_id |
| `PARSING_IN_PROGRESS` | 409 | Analysis not yet ready |
| `PARSING_FAILED` | 500 | Pipeline error |
| `UPLOAD_TOO_LARGE` | 413 | File > 10 MB |
| `INVALID_FILE_TYPE` | 415 | Unsupported format |
| `TEXTRACT_ERROR` | 502 | AWS Textract failure |
| `GEMINI_ERROR` | 502 | Gemini API failure/timeout |
| `PACKET_NOT_FOUND` | 404 | Invalid packet_id |
| `CALL_NOT_FOUND` | 404 | Invalid call_id |

---

## 7. CORS

```python
allow_origins=["https://*.base44.app", "http://localhost:3000", "http://localhost:5173"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

---

## 8. Demo Data Seeding

`POST /api/demo/seed` (or startup script) loads the pre-built demo ER scenario from `data/demo_bill.json` directly into MongoDB — skips S3/Textract entirely. Allows instant frontend demo without pipeline latency.

---

## 9. n8n Integration (Stretch)

Self-hosted on Vultr via Docker. Workflow nodes:

```
Webhook (transcript) → Append to session → Gemini HTTP call → ElevenLabs TTS → Log to MongoDB → Respond
```

MVP bypasses n8n — backend calls Gemini directly via WebSocket handler.

---

## 10. Environment Variables

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=billclarity-docs
GEMINI_API_KEY=
MONGODB_URI=mongodb+srv://...
ELEVENLABS_API_KEY=           # stretch
N8N_BASE_URL=http://localhost:5678  # stretch
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development
ALLOWED_ORIGINS=https://*.base44.app,http://localhost:3000
```

---

## 11. Python Dependencies

```txt
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
motor>=3.4.0
pymongo>=4.7.0
boto3>=1.34.0
google-generativeai>=0.5.0
python-multipart>=0.0.9
python-dotenv>=1.0.0
pydantic>=2.7.0
weasyprint>=62.0
markdown2>=2.4.0
httpx>=0.27.0
websockets>=12.0
```

---

*This sub-PRD covers all backend implementation details. See `prdplan.md` for full product specification and `prd-ai.md` for AI/Gemini prompt implementation details.*
