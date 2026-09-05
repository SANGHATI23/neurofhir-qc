# NeuroFHIR-QC

### Trustworthy longitudinal neuroimaging AI in FHIR

NeuroFHIR-QC is a research prototype for representing AI-derived longitudinal
neuroimaging measurements as reviewable FHIR R4 evidence.

The project started from a practical question:

> What should happen between an imaging model producing a measurement and that
> measurement becoming trusted clinical-style evidence?

For this prototype, an AI-derived tumor-volume result is not finalized
automatically. The result is linked to its imaging context and model provenance,
tested for stability, compared with a prior reviewed measurement, and kept
preliminary until review.

If the result is unstable, longitudinal interpretation is withheld and the case
is routed for manual review.

The current implementation uses public de-identified brain MRI and synthetic
FHIR patient context.

---

## Workflow

```text
Synthetic FHIR context
        +
Public de-identified MRI
        ↓
MONAI segmentation
        ↓
Tumor volumetry
        ↓
Perturbation / robustness checks
        ↓
QC classification
        ↓
Longitudinal comparison
        ↓
FHIR Observation + DiagnosticReport
        ↓
Task + Device + Provenance
        ↓
Human review
        ↓
Accept / correction required / reject
        ↓
FHIR transaction write-back
        ↓
Read-back and audit

Three demonstration cases are used throughout the workflow:

Case	QC result	Longitudinal behavior	Review outcome
Stable	High confidence	+2.82%	Accepted
Progression	High confidence	+63.71%	Accepted
Low confidence	Manual review required	Interpretation withheld	Correction required → rejected

The low-confidence case is intentionally challenged with severe synthetic input
corruption so that the failure-handling path can be tested.

Why FHIR?

FHIR is used as the evidence and workflow layer rather than simply as an export
format.

The implementation uses:

Patient — synthetic patient context
Condition — disease context
ImagingStudy — baseline and follow-up imaging context
Observation — prior and AI-derived volume measurements
DiagnosticReport — imaging result summary
Device — model/software identity
Task — review workflow
Provenance — algorithmic and review provenance
Practitioner — synthetic reviewer identity
Bundle — transaction write-back
CapabilityStatement — FHIR capability documentation

The workflow includes FHIR R4 reads, searches, validation, deterministic
transaction Bundles, server write-back, direct read-back, and reference
verification.

The executed interoperability tests used the public HAPI FHIR R4 sandbox.

Human review

Every current AI-derived result begins as preliminary.

The review workflow supports three transitions:

Accept
Observation       preliminary → final
DiagnosticReport  preliminary → final
Task              requested → completed
Correction required
Observation       preliminary → preliminary
DiagnosticReport  preliminary → preliminary
Task              requested → on-hold
Reject
Observation       preliminary → entered-in-error
DiagnosticReport  preliminary → entered-in-error
Task              on-hold → rejected

Rejected evidence is retained for audit rather than deleted.

The reviewer in the current demonstration is synthetic; this workflow is not a
clinician usability study.

Imaging model

The segmentation stage uses the MONAI brats_mri_segmentation bundle.

Executed configuration:

model bundle: MONAI/brats_mri_segmentation
bundle version: 0.5.4
pinned commit:
370f7f9d062745fbac445e7fe6d6616d35df04ec
checkpoint SHA-256:
860ccb3f1c21c99d0410ad8a1ac4ef6b8fab60cec0a503b0ba42675741a750ae
input modalities: T1c, T1, T2, FLAIR
architecture: 3D SegResNet

Three public research MRI cases from Medical Segmentation Decathlon
Task01 BrainTumour were used for the executable demonstration.

Results
Segmentation
Metric	Result
Cases	3
Mean whole-tumor Dice	0.9014
Mean absolute volume error	1.313 mL
Mean inference time	1.78 s
Robustness and QC
Metric	Result
Standard perturbation runs	12
Severe synthetic challenge	1
Total robustness runs	13
Low-confidence case routed to manual review	Yes
Autonomous finalization blocked	3/3

The QC thresholds are engineering workflow parameters, not calibrated clinical
probabilities.

FHIR interoperability
Metric	Result
Server validation targets	34/34
Transactions	7/7
Transaction entries	79/79
Generated/review resources read back	27/27
Critical-field preservation	100%
Reference graph edges verified	51
Review workflow
2 accepted cases
1 correction-required intermediate state
1 rejected result
4 review Provenance events
low-confidence finalization blocked throughout the executed workflow
Design decisions

A few implementation decisions were intentional.

Keep AI results preliminary

Model output is treated as evidence requiring review. A segmentation result does
not become final merely because inference completed successfully.

Separate measurement from interpretation

For the low-confidence case, the numerical result is retained for audit, but the
longitudinal interpretation is withheld.

This lets the system preserve what happened without presenting an unstable
measurement as a trusted conclusion.

Represent review as workflow state

Task is used to make the review state explicit rather than encoding review only
inside narrative text.

Preserve model and review provenance

Device identifies the model artifact, while Provenance captures both
algorithmic generation and later review actions.

Validate before and after write-back

Self-contained transaction Bundles are validated before write-back. Generated
resources are then read back and revalidated so that HTTP success alone is not
treated as proof of semantic preservation.

Implementation notes

The repository keeps several corrections visible because they affected important
design decisions.

Stable-case mismatch

The original synthetic stable baseline was 14.2 mL. The executed model produced a
follow-up volume of 19.189 mL, which implied approximately +35.1% change and did
not support a stable scenario.

The longitudinal gate therefore remained closed.

The synthetic baseline was subsequently realigned to 18.662712 mL, producing the
intended +2.82% demonstration change. The public MRI, model output, segmentation
masks, and QC evidence were not modified.

FHIR Bundle validation

Early FHIR validation exposed invalid element usage and unresolved references
between resources contained in the same transaction.

The final implementation uses R4-valid resource elements and deterministic
urn:uuid references inside self-contained transaction Bundles.

Colab / esbuild permissions

The reviewer application initially failed to build because the esbuild binary
could not execute from the mounted Google Drive filesystem.

The final build installs dependencies and runs Vite under /content, then copies
the resulting build artifacts back to persistent Drive storage.

Repository workflow

The project is notebook-driven so that each stage has a clear execution and audit
boundary.

Notebook	Purpose
00_NeuroFHIR_QC_Project_Foundation.ipynb	Project structure and configuration
NeuroFHIR_QC_Notebook_01_FIXED.ipynb	Synthetic FHIR context
02_NeuroFHIR_QC_HAPI_Server_and_Read_Operations.ipynb	HAPI transaction/read/search testing
03_NeuroFHIR_QC_Imaging_Data_Preparation_FIXED.ipynb	Public MRI preparation
04_NeuroFHIR_QC_Segmentation_and_Volumetry.ipynb	Segmentation and volumetry
05_NeuroFHIR_QC_Trust_and_Robustness_Engine.ipynb	Perturbation testing and QC
06_NeuroFHIR_QC_Longitudinal_Analysis.ipynb	Longitudinal comparison
06A_NeuroFHIR_QC_Stable_Scenario_Realignment_FIXED.ipynb	Synthetic stable-context correction
06_07_NeuroFHIR_QC_Longitudinal_and_FHIR_Evidence_Combined_R4_URN_FIXED_v2.ipynb	Final longitudinal + FHIR evidence workflow
08_NeuroFHIR_QC_Human_Review_Workflow.ipynb	Human-review state transitions
09_NeuroFHIR_QC_Evaluation.ipynb	Integrated evaluation
10_NeuroFHIR_QC_Competition_Artifacts.ipynb	AMIA competition evidence package
11_NeuroFHIR_QC_Reviewer_Application_UI_COLAB_BUILD_FIXED.ipynb	Reviewer application
12_NeuroFHIR_QC_Deployment_Usability_and_Final_Submission_Readiness_STUDENT_FIXED.ipynb	Submission-readiness audit

Historical repair notebooks are retained to document how problems were identified
and corrected.

Reproducing the workflow

The executed environment is Google Colab with project artifacts stored under:

/content/drive/MyDrive/neurofhir-qc

Recommended execution order:

00 → 01 → 02 → 03 → 04 → 05 → 06 / 06A
   → combined 06–07 → 08 → 09 → 10 → 11 → 12

Notebook 04 requires a CUDA-capable GPU. The later longitudinal, FHIR,
evaluation, application-packaging, and submission notebooks primarily operate on
persisted artifacts.

Important external dependencies include:

Medical Segmentation Decathlon Task01 BrainTumour
MONAI brats_mri_segmentation
public HAPI FHIR R4 sandbox
Google Colab / Google Drive

Model identity, selected public cases, resource identifiers, checksums, generated
manifests, validation results, and evaluation outputs are persisted by the
workflow to support reproducibility and audit.

Reviewer application

Notebook 11 builds a React/TypeScript reviewer interface with six views:

Launch and study context
Patient timeline
MRI review
Longitudinal analysis
Human review
FHIR audit

The UI provides access to the three demonstration scenarios, imaging/QC evidence,
longitudinal results, review states, and representative FHIR JSON.

Public deployment is being prepared as part of the AMIA 2026 submission workflow.

Scope and limitations

NeuroFHIR-QC is a research prototype.

It currently uses:

public de-identified research MRI
synthetic FHIR patient data
three demonstration cases
a synthetic scripted reviewer
a public FHIR sandbox

It has not been clinically validated and is not intended for diagnosis or
patient-care decisions.

The current results should therefore be interpreted as implementation and
workflow evidence rather than clinical-performance evidence.
The prototype focuses on one question:

How can an AI-derived imaging result move from model output to quality-checked,
reviewable, provenance-aware FHIR evidence?

Author

Sanghati Basu
MS Healthcare Informatics
University of Illinois Springfield
