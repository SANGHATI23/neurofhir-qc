# NeuroFHIR-QC

## Trustworthy Longitudinal Neuroimaging AI in FHIR

**NeuroFHIR-QC** is a human-in-the-loop FHIR R4 research application for longitudinal brain-tumor and lesion volumetry, AI quality control, provenance, review workflow, and validated FHIR write-back.

The project connects public de-identified research MRI with **synthetic FHIR R4 patient context** and demonstrates an end-to-end workflow in which an AI-derived imaging biomarker is not treated as trustworthy simply because a model produced it.

Instead, NeuroFHIR-QC asks:

> **Can an AI-derived longitudinal imaging result be quality-checked, made traceable, reviewed by a human, and represented safely as interoperable FHIR evidence?**

The current prototype implements that workflow from imaging preparation through segmentation, robustness testing, longitudinal comparison, FHIR evidence generation, human review, integrated evaluation, and a reviewer-facing application.

---

## Why NeuroFHIR-QC?

Medical-imaging AI pipelines often stop after producing a segmentation or prediction.

A usable clinical-informatics workflow requires more:

* What data produced the result?
* Which model and software version generated it?
* How stable is the output under controlled perturbation?
* Should the result be trusted or manually reviewed?
* How does it compare with a prior measurement?
* Can an unstable result be prevented from becoming final?
* Can the evidence be represented in FHIR?
* Can a reviewer inspect the complete provenance trail?

NeuroFHIR-QC treats these as part of the same problem.

The system therefore combines:

**MRI → AI segmentation → volumetry → robustness/QC → longitudinal interpretation → FHIR evidence → human review → provenance → reviewer audit**

---

# System Workflow

```text
Public de-identified MRI
        │
        ▼
Imaging preparation
        │
        ▼
MONAI brain-tumor segmentation
        │
        ▼
Tumor / lesion volumetry
        │
        ▼
Controlled perturbation testing
        │
        ▼
NeuroFHIR-QC confidence score
        │
        ├──────── High confidence
        │               │
        │               ▼
        │          Longitudinal interpretation
        │
        └──────── Manual review required
                        │
                        ▼
                 Interpretation withheld
                        │
                        ▼
FHIR R4 evidence generation
        │
        ▼
Observation + DiagnosticReport
+ Device + Task + Provenance
        │
        ▼
Human review
        │
        ├── Accept
        ├── Correction required
        └── Reject
        │
        ▼
Validated FHIR transaction write-back
        │
        ▼
Direct read-back + audit
        │
        ▼
Reviewer-facing application
```

---

# Demonstration Scenarios

The executable prototype contains three deliberately different workflow scenarios.

| Scenario           | Intended behavior                | QC behavior            | Review outcome                 |
| ------------------ | -------------------------------- | ---------------------- | ------------------------------ |
| **Stable**         | Small longitudinal volume change | High confidence        | Accepted                       |
| **Progression**    | Meaningful increase in volume    | High confidence        | Accepted                       |
| **Low confidence** | Deliberately unstable AI output  | Manual review required | Correction-required → Rejected |

The low-confidence case is particularly important: the numerical result remains available for audit, but its longitudinal interpretation is withheld and autonomous finalization is blocked.

---

# Imaging and Segmentation

The imaging stage uses three public de-identified research MRI cases prepared from **Medical Segmentation Decathlon Task01** data and linked only to synthetic FHIR patient context.

Segmentation uses the pinned MONAI `brats_mri_segmentation` model bundle:

* MONAI model bundle version: `0.5.4`
* Four MRI modalities:

  * T1 contrast-enhanced
  * T1
  * T2
  * FLAIR
* 3D sliding-window inference
* Tumor-core segmentation
* Whole-tumor segmentation
* Enhancing-tumor segmentation
* Reconstructed multiclass masks
* Volume calculation in milliliters

The imaging stage also produces overlays, masks, structured manifests, model identity information, checksums, and inference audit artifacts.

---

# Executed Evaluation Results

The integrated evaluation uses persisted artifacts from the executed pipeline rather than rerunning inference.

## Segmentation and Volumetry

| Metric                     |       Result |
| -------------------------- | -----------: |
| Public research MRI cases  |        **3** |
| Mean whole-tumor Dice      |   **0.9014** |
| Mean absolute volume error | **1.313 mL** |
| Mean inference time        |   **1.78 s** |

These results represent an **executable demonstration benchmark**, not independent external clinical validation.

---

## Robustness and Quality Control

The QC engine evaluates model stability using controlled perturbations.

| Evaluation                                       |   Result |
| ------------------------------------------------ | -------: |
| Controlled perturbation types                    |    **4** |
| Standard perturbation runs                       |   **12** |
| Severe low-confidence challenge                  |    **1** |
| Total robustness runs                            |   **13** |
| Low-confidence manual-review detection           | **100%** |
| Preliminary-status retention for unstable output | **100%** |
| Autonomous-finalization block                    | **100%** |

The QC score is an **engineering workflow signal**, not a calibrated clinical probability.

---

# Longitudinal Analysis

Three longitudinal scenarios were executed successfully.

| Scenario       | Prior volume | Current volume |      Change | Interpretation             |
| -------------- | -----------: | -------------: | ----------: | -------------------------- |
| Stable         |    18.663 mL |      19.189 mL |  **+2.82%** | Stable-range behavior      |
| Progression    |    12.500 mL |      20.464 mL | **+63.71%** | Meaningful volume increase |
| Low confidence |    16.100 mL |       1.626 mL | **−89.90%** | **Withheld**               |

Results:

* Longitudinal calculations: **3/3**
* Scenario alignment: **3/3**
* Low-confidence interpretation withholding: **100%**

The low-confidence numerical measurement remains traceable for audit while the application refuses to present it as a trusted longitudinal conclusion.

---

# FHIR R4 Interoperability

NeuroFHIR-QC uses **FHIR R4 / 4.0.1** and demonstrates both retrieval of patient/imaging context and structured write-back of AI-derived evidence.

## Demonstrated FHIR Resources

| Resource              | Use                                                     |
| --------------------- | ------------------------------------------------------- |
| `Patient`             | Synthetic patient context                               |
| `Condition`           | Synthetic neurological condition / phenotype            |
| `ImagingStudy`        | Imaging-study context                                   |
| `Observation`         | Prior and AI-derived volume, QC information, and status |
| `DiagnosticReport`    | AI-assisted imaging-biomarker summary                   |
| `Device`              | Model/software/version identity                         |
| `Provenance`          | Algorithm-generation and review audit trail             |
| `Task`                | Human-review workflow state                             |
| `Practitioner`        | Explicitly synthetic reviewer                           |
| `Bundle`              | Deterministic FHIR transaction write-back               |
| `CapabilityStatement` | Demonstrated application-side FHIR interactions         |

## Demonstrated FHIR Operations

* FHIR R4 REST
* CapabilityStatement discovery
* resource reads
* search operations
* `$validate`
* `OperationOutcome`
* deterministic resource identifiers
* transaction Bundles
* deterministic PUT
* server write-back
* direct resource read-back
* reference-graph verification

The executed workflow uses the public **HAPI FHIR R4 sandbox**.

### FHIR Evaluation

| Metric                               |    Result |
| ------------------------------------ | --------: |
| Server validation                    | **34/34** |
| Successful transactions              |   **7/7** |
| Successful transaction entries       | **79/79** |
| Critical reviewed-field preservation |  **100%** |
| Human-review Provenance capture      |   **4/4** |

---

# Human-in-the-Loop Review

AI output is intentionally kept **preliminary** until review.

The workflow supports:

### Accept

```text
Observation → final
DiagnosticReport → final
Task → completed
```

### Correction Required

```text
Observation → preliminary
DiagnosticReport → preliminary
Task → on-hold
```

### Reject

```text
Observation → entered-in-error
DiagnosticReport → entered-in-error
Task → rejected
```

Executed review results:

* **2 accepted cases**
* **1 correction-required intermediate state**
* **1 rejected low-confidence result**
* **4 review Provenance events**
* reviewer role, timestamp, reason, and note captured for **4/4** events
* low-confidence finalization blocked in **100%** of the tested workflow

The reviewer used in the executable demonstration is synthetic. These results demonstrate workflow mechanics, not clinician agreement.

---

# Reviewer Application

Notebook 11 generates a reviewer-facing React application over the executed NeuroFHIR-QC evidence.

The application contains **3 cases**, **17 representative FHIR resources**, and six primary screens.

## 1. Launch and Study Context

Shows:

* research-environment label
* synthetic patient context
* FHIR server
* repository context
* FHIR version
* explicit implementation boundaries

## 2. Patient Timeline

Shows:

* Condition
* baseline ImagingStudy
* follow-up ImagingStudy
* prior reviewed Observation
* current AI-derived Observation
* workflow status

## 3. MRI Review

Shows:

* archived imaging evidence
* segmentation visualization
* Dice and volumetry metrics
* QC score
* confidence category
* provenance-completeness information

## 4. Longitudinal Analysis

Shows:

* baseline volume
* follow-up volume
* absolute change
* percentage change
* scenario alignment
* QC-aware interpretation
* interpretation withholding when unstable

## 5. Human Review

Shows:

* accept
* correction-required
* reject
* Observation status transition
* DiagnosticReport status transition
* Task transition
* review reason
* review note
* review Provenance

## 6. FHIR Audit

Shows:

* linked FHIR resources
* representative FHIR JSON
* validation evidence
* transaction evidence
* write-back/read-back evidence
* provenance and reference relationships

The frontend production build passed successfully.

Notebook 11 also generates:

* React + TypeScript frontend
* FastAPI read-only evidence service
* Docker configuration
* Docker Compose
* GitHub Pages deployment workflow
* production static build
* application source archive

---

# Notebook Pipeline

The repository is deliberately notebook-driven so each stage has an auditable execution boundary.

| Notebook                                                                           | Purpose                                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `00_NeuroFHIR_QC_Project_Foundation.ipynb`                                         | Project foundation, directories, configuration, manifests, and provenance            |
| `NeuroFHIR_QC_Notebook_01_FIXED.ipynb`                                             | Synthetic FHIR R4 dataset and linked demonstration context                           |
| `02_NeuroFHIR_QC_HAPI_Server_and_Read_Operations.ipynb`                            | HAPI FHIR server connectivity and read/search operations                             |
| `03_NeuroFHIR_QC_Imaging_Data_Preparation_FIXED.ipynb`                             | Public MRI acquisition, preparation, integrity checks, and manifests                 |
| `04_NeuroFHIR_QC_Segmentation_and_Volumetry.ipynb`                                 | MONAI segmentation, volumetry, overlays, and segmentation evaluation                 |
| `05_NeuroFHIR_QC_Trust_and_Robustness_Engine.ipynb`                                | Perturbation testing, QC signals, and confidence categories                          |
| `06_NeuroFHIR_QC_Longitudinal_Analysis.ipynb`                                      | Baseline-to-follow-up longitudinal analysis                                          |
| `06A_NeuroFHIR_QC_Stable_Scenario_Realignment_FIXED.ipynb`                         | Stable-case alignment correction                                                     |
| `06_07_NeuroFHIR_QC_Longitudinal_and_FHIR_Evidence_Combined_R4_URN_FIXED_v2.ipynb` | Final longitudinal evidence + FHIR R4 write-back workflow                            |
| `08_NeuroFHIR_QC_Human_Review_Workflow.ipynb`                                      | Human-review transitions and review Provenance                                       |
| `09_NeuroFHIR_QC_Evaluation.ipynb`                                                 | Integrated technical evaluation                                                      |
| `10_NeuroFHIR_QC_Competition_Artifacts.ipynb`                                      | Competition package, CapabilityStatement, evidence, script, and submission artifacts |
| `11_NeuroFHIR_QC_Reviewer_Application_UI_COLAB_BUILD_FIXED.ipynb`                  | Reviewer-facing React/FastAPI application                                            |
| `12_NeuroFHIR_QC_Deployment_Usability_and_Final_Submission_Readiness.ipynb`        | Deployment, usability, media, eligibility, and final readiness audit                 |

The combined/fixed notebooks preserve debugging and correction history rather than hiding intermediate failures.

---

# Reproducibility

The project emphasizes reproducibility through:

* pinned model identity
* model checkpoint checksum
* deterministic case identifiers
* persisted intermediate artifacts
* JSON and CSV evidence manifests
* notebook completion audits
* FHIR validation reports
* transaction reports
* direct read-back checks
* reference-graph checks
* provenance records
* SHA-256 artifact inventories
* explicit failure and correction history

The evaluation notebooks consume persisted evidence rather than silently regenerating or replacing prior results.

---

# Running the Project

The workflow was developed for **Google Colab + Google Drive**.

## Recommended execution order

Run the notebooks in order:

```text
00
01
02
03
04
05
06
06A
06/07 combined final notebook
08
09
10
11
12
```

Notebook 04 requires a GPU runtime for segmentation inference.

Later evaluation and packaging notebooks primarily consume persisted artifacts and generally do not need to rerun GPU inference.

Each notebook contains prerequisite gates and should be executed from top to bottom.

---

# Reviewer Application Build

Notebook 11 generates application source under the project workspace:

```text
app/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
└── docker-compose.yml
```

The generated static production build is written to:

```text
submission/reviewer_application/
```

The application is designed so the reviewer path can operate from archived executed evidence rather than depending entirely on public-sandbox availability during review.

---

# Current Project Status

### Completed

* [x] Project foundation
* [x] Synthetic FHIR patient context
* [x] FHIR server read/search operations
* [x] Public research MRI preparation
* [x] MONAI segmentation
* [x] Tumor/lesion volumetry
* [x] Segmentation evaluation
* [x] Controlled perturbation testing
* [x] QC/confidence engine
* [x] Stable/progression/low-confidence scenarios
* [x] Longitudinal analysis
* [x] QC-aware interpretation withholding
* [x] FHIR R4 evidence generation
* [x] FHIR validation
* [x] Transaction write-back
* [x] Direct read-back
* [x] Human-review workflow
* [x] Review Provenance
* [x] Integrated evaluation
* [x] Competition evidence package
* [x] CapabilityStatement
* [x] Reviewer-facing application
* [x] React production build
* [x] Deployment/readiness audit

### Remaining before final competition submission

* [ ] Public reviewer deployment URL
* [ ] Final demonstration video
* [ ] Competition screenshot set
* [ ] Real formative usability data
* [ ] Final submission-category eligibility confirmation
* [ ] Required advisor attestation if submitted as Student
* [ ] Final branding assets
* [ ] Remaining portal administrative fields

Accordingly, Notebook 12 currently reports:

```text
completed-with-open-blockers
```

The technical application is complete; the remaining blockers concern public access, media, usability, eligibility, branding, and submission administration.

---

# Important Limitations

NeuroFHIR-QC is currently a **research prototype**.

It does **not** claim:

* clinical validation
* diagnostic accuracy
* independent external validation
* real-patient clinical use
* hospital deployment
* clinician agreement
* completed real-user usability evaluation
* production SMART App Launch
* production OAuth integration
* US Core conformance
* CDS Hooks integration
* CQL integration
* production EHR integration

The three MRI cases are an executable demonstration benchmark.

The FHIR patient context is synthetic.

The public HAPI FHIR server is a sandbox environment.

QC values are engineering workflow signals rather than calibrated clinical probabilities.

---

# Safety Design Principles

NeuroFHIR-QC follows several explicit design principles:

1. **AI output begins as preliminary evidence.**
2. **Low-confidence results remain visible but are not automatically interpreted.**
3. **Unstable output can trigger mandatory manual review.**
4. **Human decisions create explicit state transitions.**
5. **Rejected AI evidence is preserved for audit rather than silently deleted.**
6. **Model identity and generation history are represented through Device and Provenance.**
7. **FHIR write-back is validated and read back from the server.**
8. **Synthetic and research data boundaries are visible throughout the application.**

---

# Research Direction

NeuroFHIR-QC explores a broader informatics question:

> **How should AI-derived longitudinal imaging biomarkers become trustworthy, reviewable, provenance-aware, interoperable evidence rather than isolated model outputs?**

The current prototype demonstrates one architecture for connecting imaging AI reliability with FHIR-native evidence and human review.

Future work may include:

* larger independent imaging cohorts
* additional imaging biomarkers
* external robustness validation
* multi-site testing
* calibrated QC models
* clinician usability evaluation
* SMART App Launch
* authenticated production FHIR environments
* implementation-guide profiling
* real-world clinical workflow studies

---

# Intended Use

This repository is intended for:

* biomedical informatics research
* clinical informatics prototyping
* FHIR interoperability research
* medical-imaging AI reliability research
* human-in-the-loop AI workflow research
* reproducible demonstration and education

**Not for clinical diagnosis or patient-care decisions.**

---

# Author

**Sanghati Basu**

NeuroFHIR-QC is an independent biomedical-informatics research prototype developed around trustworthy longitudinal neuroimaging AI, FHIR interoperability, quality control, provenance, and human review.

---

## Repository

`SANGHATI23/neurofhir-qc`

---

> **Research-use notice:** NeuroFHIR-QC uses public de-identified research imaging and synthetic FHIR patient context. Results are provided for research and demonstration purposes only and are not intended for clinical diagnosis or treatment.

