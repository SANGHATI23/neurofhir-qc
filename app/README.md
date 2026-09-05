# NeuroFHIR-QC Reviewer Application

## Static frontend

```bash
cd app/frontend
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## FastAPI evidence service

```bash
cd app/backend
pip install -r requirements.txt
export NEUROFHIR_QC_APP_DATA_PATH="$PWD/data/app_data.json"
uvicorn app.main:app --reload
```

## Docker Compose

```bash
cd app
docker compose up --build
```

Reviewer UI: `http://localhost:8080`  
Evidence API: `http://localhost:8000/docs`

The application uses public de-identified research imaging and synthetic FHIR R4 context only.
