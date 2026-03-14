# BillClarity Appeals Engine

> AI Medical Bill Intelligence + Dispute Automation Platform

BillClarity analyzes medical bills, detects billing errors, benchmarks charges against healthcare pricing data, and generates structured appeal packets — all powered by Google Gemini 2.0 Flash.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + Radix UI + Recharts
- **Backend:** Python 3.11+ / FastAPI / Uvicorn
- **AI:** Google Gemini 2.0 Flash
- **OCR:** AWS Textract
- **Storage:** AWS S3
- **Database:** MongoDB Atlas (motor async driver)

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

## Project Structure

- `src/` — React frontend (pages, components, hooks, services, types)
- `backend/` — FastAPI backend (routers, services, models, prompts)
- `docs/` — PRD documentation

See `skeleton_file_structure.md` in the project artifacts for the full file map.
