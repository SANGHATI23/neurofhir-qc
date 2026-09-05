from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

APP_DATA_PATH = Path(
    os.getenv(
        "NEUROFHIR_QC_APP_DATA_PATH",
        "/app/data/app_data.json",
    )
)
FHIR_BASE_URL = os.getenv(
    "NEUROFHIR_QC_FHIR_BASE_URL",
    "https://hapi.fhir.org/baseR4",
).rstrip("/")


def load_data() -> dict[str, Any]:
    if not APP_DATA_PATH.exists():
        raise RuntimeError(f"Application data not found: {APP_DATA_PATH}")
    return json.loads(APP_DATA_PATH.read_text(encoding="utf-8"))


app = FastAPI(
    title="NeuroFHIR-QC Reviewer Evidence API",
    version="0.1.0",
    description=(
        "Read-only API over executed public-imaging and synthetic-FHIR "
        "research evidence."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        value.strip()
        for value in os.getenv(
            "NEUROFHIR_QC_ALLOWED_ORIGINS",
            "*",
        ).split(",")
        if value.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ReviewPreviewRequest(BaseModel):
    case_id: str = Field(
        pattern=r"^(stable|progression|low-confidence)$"
    )
    decision: str = Field(
        pattern=r"^(accepted|correction-required|rejected)$"
    )
    reason: str = Field(min_length=3, max_length=500)
    note: str = Field(min_length=3, max_length=1000)


@app.get("/api/health")
def health() -> dict[str, Any]:
    data = load_data()
    return {
        "status": "ok",
        "project": data["project"]["name"],
        "case_count": len(data["cases"]),
        "synthetic_fhir_only": True,
        "real_patient_data": False,
    }


@app.get("/api/app-data")
def app_data() -> dict[str, Any]:
    return load_data()


@app.get("/api/cases")
def cases() -> list[dict[str, Any]]:
    return load_data()["cases"]


@app.get("/api/cases/{case_id}")
def case(case_id: str) -> dict[str, Any]:
    item = next(
        (
            row
            for row in load_data()["cases"]
            if row["case_id"] == case_id
        ),
        None,
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    return item


@app.get("/api/fhir/{resource_type}/{resource_id}")
def local_resource(
    resource_type: str,
    resource_id: str,
) -> dict[str, Any]:
    reference = f"{resource_type}/{resource_id}"
    resource = load_data()[
        "representative_fhir_resources"
    ].get(reference)
    if resource is None:
        raise HTTPException(
            status_code=404,
            detail="Representative FHIR resource not found.",
        )
    return resource


@app.get("/api/fhir-live/{resource_type}/{resource_id}")
async def live_resource(
    resource_type: str,
    resource_id: str,
) -> dict[str, Any]:
    if not resource_type.replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid resource type.")
    if not resource_id.replace("-", "").replace(".", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid resource id.")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{FHIR_BASE_URL}/{resource_type}/{resource_id}",
            headers={"Accept": "application/fhir+json"},
        )

    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="FHIR resource not found.")
    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"FHIR request failed: HTTP {response.status_code}",
        )
    return response.json()


@app.post("/api/review-preview")
def review_preview(
    request: ReviewPreviewRequest,
) -> dict[str, Any]:
    status_map = {
        "accepted": {
            "Observation": "final",
            "DiagnosticReport": "final",
            "Task": "completed",
        },
        "correction-required": {
            "Observation": "preliminary",
            "DiagnosticReport": "preliminary",
            "Task": "on-hold",
        },
        "rejected": {
            "Observation": "entered-in-error",
            "DiagnosticReport": "entered-in-error",
            "Task": "rejected",
        },
    }
    return {
        "preview_only": True,
        "case_id": request.case_id,
        "decision": request.decision,
        "status_transitions": status_map[request.decision],
        "reason": request.reason,
        "note": request.note,
        "writeback_performed": False,
    }
