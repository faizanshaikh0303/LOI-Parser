# Commercial Real Estate LOI Parser

AI-powered tool to extract deal terms from call transcripts and generate professional Letters of Intent for both lease and purchase transactions.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, Groq API (llama-3.3-70b)
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Document Service**: Node.js, docxtemplater

## Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to .env
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Document Service Setup
```bash
cd document-service
npm install
npm start
```

## Usage

1. Open http://localhost:5173
2. Paste a broker-owner call transcript
3. Click "Parse Transcript" to extract fields
4. Review and edit extracted data (yellow = low confidence)
5. Click "Generate LOI" to download .docx

## Features

- ✅ AI extraction with confidence scoring (<70% = yellow highlight)
- ✅ Smart conditional template (lease vs purchase)
- ✅ Real-time field validation
- ✅ Downloadable Word documents

## Git Setup

### Initialize Repository
```bash
git init
git add .
git commit -m "Initial commit: CRE LOI Parser"
```

### Connect to Remote
```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

### Subsequent Commits
```bash
git add .
git commit -m "Your commit message"
git push
```

### .gitignore
Already configured to exclude:
- `node_modules/`
- `venv/`
- `.env`
- `__pycache__/`
- Build artifacts

## Project Structure

```
LOI Parser/
├── backend/          # FastAPI + Groq extraction
│   ├── app/
│   │   ├── models.py     # Pydantic schemas
│   │   ├── services.py   # Groq LLM service
│   │   └── main.py       # FastAPI routes
│   └── requirements.txt
├── frontend/         # React UI
│   └── src/
│       └── components/
│           └── LOIReview.tsx  # Main component
├── document-service/ # docx generation
│   ├── index.js
│   └── template.docx
└── README.md
```

## Environment Variables

**backend/.env:**
```
GROQ_API_KEY=your_groq_api_key_here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
GROQ_MODEL=llama-3.3-70b-versatile
```

## API Endpoints

- `POST /parse` - Extract LOI fields from transcript
- `POST /parse/mock` - Load mock data for testing
- `POST /generate-document` - Generate .docx file

## License

MIT
