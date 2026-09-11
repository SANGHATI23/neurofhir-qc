import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Database,
  FileJson2,
  FlaskConical,
  GitBranch,
  Image,
  ShieldCheck,
  UserRoundSearch
} from "lucide-react";

const screens = [
  { id: "launch", label: "Launch", icon: FlaskConical },
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "mri", label: "MRI Review", icon: Image },
  { id: "longitudinal", label: "Longitudinal", icon: GitBranch },
  { id: "review", label: "Human Review", icon: UserRoundSearch },
  { id: "fhir", label: "FHIR Audit", icon: FileJson2 }
];

const number = (value: any, digits = 2) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(digits);

function Pill({ value, tone }: any) {
  const selected =
    tone ||
    (/high|accepted|final|completed|passed|aligned/i.test(value)
      ? "good"
      : /manual|correction|preliminary|requested|on-hold/i.test(value)
        ? "warn"
        : /rejected|entered-in-error|withheld/i.test(value)
          ? "danger"
          : "neutral");
  return <span className={`pill ${selected}`}>{value}</span>;
}

function Metric({ label, value, helper }: any) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  );
}

function Header({ icon, title, subtitle }: any) {
  return (
    <header className="section-header">
      <div className="section-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </header>
  );
}

function Alert({ children, tone = "info" }: any) {
  return (
    <div className={`alert ${tone}`}>
      {tone === "danger" ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
      <div>{children}</div>
    </div>
  );
}

function PatientBanner({ item }: any) {
  return (
    <section className="patient-banner">
      <div>
        <span className="eyebrow">Synthetic research context</span>
        <h3>{item.patient.display}</h3>
        <p>{item.condition.display}</p>
      </div>
      <div className="banner-tags">
        <Pill value="Synthetic patient" tone="neutral" />
        <Pill value={item.qc.category} />
        <Pill value={item.review.final_observation_status} />
      </div>
    </section>
  );
}

function Launch({ data, item }: any) {
  return (
    <>
      <Header
        icon={<FlaskConical />}
        title="Launch and study context"
        subtitle="The reviewer path begins with FHIR-linked synthetic patient context."
      />
      <div className="hero-grid">
        <section className="hero">
          <span className="eyebrow">Research MVP</span>
          <h1>{data.project.name}</h1>
          <p>{data.project.tagline}</p>
          <div className="hero-tags">
            <Pill value={data.project.environment} tone="neutral" />
            <Pill value={`FHIR ${data.project.fhir_version}`} tone="good" />
            <Pill value="Human review required" tone="warn" />
          </div>
        </section>
        <section className="panel launch-panel">
          <h3>Environment status</h3>
          <dl>
            <div><dt>FHIR server</dt><dd>{data.project.fhir_server}</dd></div>
            <div><dt>Patient context</dt><dd>{item.patient.reference}</dd></div>
            <div><dt>Repository</dt><dd><a href={data.project.repository_url}>Open source</a></dd></div>
            <div><dt>SMART status</dt><dd>{data.project.smart_status}</dd></div>
          </dl>
        </section>
      </div>
      <Alert><strong>Data boundary:</strong> {data.project.data_boundary}</Alert>
      <div className="metric-grid">
        <Metric label="Mean whole-tumor Dice" value={number(data.summary_metrics.mean_dice, 4)} />
        <Metric label="Robustness runs" value={data.summary_metrics.robustness_runs} />
        <Metric label="FHIR validation" value={data.summary_metrics.fhir_validation} />
        <Metric label="Transaction entries" value={data.summary_metrics.transaction_entries} />
      </div>
    </>
  );
}

function Timeline({ item }: any) {
  const rows = [
    ...item.imaging_studies.map((study: any, index: number) => ({
      title: index === 0 ? "Baseline MRI" : "Follow-up MRI",
      date: study.started || "Archived FHIR date",
      detail: study.description,
      reference: study.reference,
      status: study.status || "available"
    })),
    {
      title: "Prior reviewed volume",
      date: "FHIR Observation",
      detail: `${number(item.longitudinal.prior_volume_ml, 3)} mL`,
      reference: item.prior_observation.reference,
      status: item.prior_observation.status
    },
    {
      title: "Current AI-derived volume",
      date: "Model-generated evidence",
      detail: `${number(item.longitudinal.current_volume_ml, 3)} mL`,
      reference: item.fhir.generated_resources.Observation,
      status: "preliminary"
    }
  ];

  return (
    <>
      <Header
        icon={<Activity />}
        title="Patient timeline"
        subtitle="Diagnosis, imaging studies, prior evidence, current AI result, and review state."
      />
      <PatientBanner item={item} />
      <div className="timeline">
        {rows.map((row: any) => (
          <article className="timeline-row" key={`${row.title}-${row.reference}`}>
            <div className="dot" />
            <div>
              <span className="eyebrow">{row.date}</span>
              <h3>{row.title}</h3>
              <p>{row.detail}</p>
              <code>{row.reference}</code>
            </div>
            <Pill value={row.status} />
          </article>
        ))}
      </div>
    </>
  );
}

function MRIReview({ item }: any) {
  return (
    <>
      <Header
        icon={<Image />}
        title="MRI review"
        subtitle="Public research-image evidence, segmentation metrics, and QC signals."
      />
      <PatientBanner item={item} />
      <div className="viewer-layout">
        <section className="panel viewer">
          <div className="panel-head">
            <strong>Archived imaging evidence</strong>
            <Pill value="Public de-identified image" tone="neutral" />
          </div>
          {item.images.length ? (
            <div className="image-grid">
              {item.images.map((path: string) => (
                <figure key={path}>
                  <img src={path} alt={`${item.display_name} evidence`} />
                  <figcaption>{path.split("/").pop()}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="empty-viewer">
              <BrainCircuit size={52} />
              <p>No case-specific PNG was discovered. Quantitative evidence remains available.</p>
            </div>
          )}
        </section>
        <aside className="panel quality">
          <span className="eyebrow">Quality and trust</span>
          <h3>{item.qc.category}</h3>
          <div className="qc-score">{number(item.qc.score, 3)}</div>
          <dl>
            <div><dt>Dice</dt><dd>{number(item.segmentation.dice, 4)}</dd></div>
            <div><dt>Sensitivity</dt><dd>{number(item.segmentation.sensitivity, 4)}</dd></div>
            <div><dt>Precision</dt><dd>{number(item.segmentation.precision, 4)}</dd></div>
            <div><dt>HD95</dt><dd>{number(item.segmentation.hd95_mm, 3)} mm</dd></div>
            <div><dt>Inference</dt><dd>{number(item.segmentation.inference_seconds, 2)} s</dd></div>
            <div><dt>Provenance completeness</dt><dd>{number(item.qc.provenance_completeness_score * 100, 1)}%</dd></div>
          </dl>
        </aside>
      </div>
      {item.qc.category === "Manual review required" ? (
        <Alert tone="danger">
          <strong>Responsible failure handling:</strong> instability is visible, interpretation is withheld, and autonomous finalization is blocked.
        </Alert>
      ) : (
        <Alert>
          A high-confidence engineering category still does not make the result final. Human review remains required.
        </Alert>
      )}
    </>
  );
}

function Longitudinal({ item }: any) {
  const maximum = Math.max(
    item.longitudinal.prior_volume_ml,
    item.longitudinal.current_volume_ml,
    1
  );
  return (
    <>
      <Header
        icon={<GitBranch />}
        title="Longitudinal analysis"
        subtitle="Baseline-to-follow-up change with QC-aware interpretation."
      />
      <PatientBanner item={item} />
      <div className="longitudinal-layout">
        <section className="panel chart">
          <div className="bar-column">
            <div
              className="volume-bar baseline"
              style={{ height: `${(item.longitudinal.prior_volume_ml / maximum) * 100}%` }}
            />
            <strong>{number(item.longitudinal.prior_volume_ml, 3)} mL</strong>
            <small>Prior reviewed</small>
          </div>
          <div className="bar-column">
            <div
              className="volume-bar current"
              style={{ height: `${(item.longitudinal.current_volume_ml / maximum) * 100}%` }}
            />
            <strong>{number(item.longitudinal.current_volume_ml, 3)} mL</strong>
            <small>Current AI-derived</small>
          </div>
        </section>
        <section className="panel change-panel">
          <span className="eyebrow">Executed change</span>
          <div className="change-number">
            {item.longitudinal.percent_change >= 0 ? "+" : ""}
            {number(item.longitudinal.percent_change, 2)}%
          </div>
          <p>{item.longitudinal.display_label || "Longitudinal result"}</p>
          <Pill
            value={item.longitudinal.scenario_alignment_passed ? "Scenario aligned" : "Alignment failed"}
            tone={item.longitudinal.scenario_alignment_passed ? "good" : "danger"}
          />
        </section>
      </div>
      {item.longitudinal.interpretation_withheld ? (
        <Alert tone="danger">
          <strong>Interpretation withheld.</strong> The number remains traceable for audit, but instability prevents a longitudinal conclusion.
        </Alert>
      ) : (
        <Alert>
          <strong>Interpretation:</strong> {item.longitudinal.interpretation || item.longitudinal.display_label}
        </Alert>
      )}
    </>
  );
}


function EvidencePassport({ data, item, onOpenFHIR }: any) {
  const observationReference = item.fhir.generated_resources.Observation;
  const observation = data.representative_fhir_resources?.[observationReference];
  const method =
    observation?.method?.text ||
    "MONAI SegResNet with NeuroFHIR-QC processing";
  const deviceReference =
    observation?.device?.reference ||
    "Device/nqc-monai-brats-segresnet-0-5-4";
  const provenanceReference = item.fhir.generated_resources.Provenance;
  const changeDisplay = item.longitudinal.interpretation_withheld
    ? "Withheld pending human review"
    : `${item.longitudinal.percent_change >= 0 ? "+" : ""}${number(
        item.longitudinal.percent_change,
        2
      )}%`;
  const currentStatus =
    observation?.status || item.review.final_observation_status || "preliminary";

  return (
    <section className="panel evidence-passport">
      <div className="passport-head">
        <div>
          <span className="eyebrow">AI Evidence Passport</span>
          <h3>Evidence identity, quality, provenance, and review gate</h3>
        </div>
        <Pill value="Human review required" tone="warn" />
      </div>

      <div className="passport-grid">
        <div>
          <span>Model / method</span>
          <strong>{method}</strong>
        </div>
        <div>
          <span>Device identity</span>
          <code>{deviceReference}</code>
        </div>
        <div>
          <span>Engineering QC</span>
          <strong>{item.qc.category}</strong>
          <small>Score {number(item.qc.score, 3)}</small>
        </div>
        <div>
          <span>Current AI-derived volume</span>
          <strong>{number(item.longitudinal.current_volume_ml, 3)} mL</strong>
        </div>
        <div>
          <span>Longitudinal display</span>
          <strong>{changeDisplay}</strong>
        </div>
        <div>
          <span>Provenance completeness</span>
          <strong>{number(item.qc.provenance_completeness_score * 100, 1)}%</strong>
        </div>
        <div>
          <span>Current FHIR Observation status</span>
          <strong>{currentStatus}</strong>
        </div>
        <div>
          <span>AI-generation provenance</span>
          <code>{provenanceReference}</code>
        </div>
      </div>

      <details className="passport-provenance">
        <summary>View provenance summary</summary>
        <div className="passport-provenance-body">
          <p>
            <strong>Observation:</strong> <code>{observationReference}</code>
          </p>
          <p>
            <strong>Device:</strong> <code>{deviceReference}</code>
          </p>
          <p>
            <strong>AI-generation Provenance:</strong> <code>{provenanceReference}</code>
          </p>
          <p>
            <strong>Review Provenance:</strong>{" "}
            <code>
              {item.review.events[item.review.events.length - 1]
                ?.review_provenance_reference || "Not available"}
            </code>
          </p>
        </div>
      </details>

      <div className="passport-footer">
        <p>
          <strong>Limitation:</strong> Engineering QC scores and display thresholds
          support this research workflow; they are not calibrated clinical
          probabilities or validated clinical response criteria.
        </p>
        <button type="button" className="passport-action" onClick={onOpenFHIR}>
          <Database size={17} />
          View FHIR evidence
        </button>
      </div>
    </section>
  );
}

function ReconciliationSummary({ item }: any) {
  const events = item.review.events || [];
  const finalEvent =
    events.find((event: any) => event.final_event_for_case) ||
    events[events.length - 1];

  return (
    <section className="panel reconciliation-summary">
      <div>
        <span className="eyebrow">Human–AI reconciliation</span>
        <h3>{(item.review.final_decision || "Pending").replaceAll("-", " ")}</h3>
        <p>{finalEvent?.reason || "No final review reason is available."}</p>
      </div>
      <div className="reconciliation-state">
        <div>
          <span>Observation</span>
          <strong>{item.review.final_observation_status}</strong>
        </div>
        <div>
          <span>DiagnosticReport</span>
          <strong>{item.review.final_report_status}</strong>
        </div>
        <div>
          <span>Task</span>
          <strong>{item.review.final_task_status}</strong>
        </div>
      </div>
    </section>
  );
}

function HumanReview({ data, item, onOpenFHIR }: any) {
  return (
    <>
      <Header
        icon={<UserRoundSearch />}
        title="Human review"
        subtitle="Accept, correction-required, and reject transitions with review Provenance."
      />
      <PatientBanner item={item} />
      <EvidencePassport data={data} item={item} onOpenFHIR={onOpenFHIR} />
      <div className="metric-grid">
        <Metric label="Final decision" value={item.review.final_decision || "Pending"} />
        <Metric label="Observation" value={item.review.final_observation_status} />
        <Metric label="DiagnosticReport" value={item.review.final_report_status} />
        <Metric label="Task" value={item.review.final_task_status} />
      </div>
      <ReconciliationSummary item={item} />
      <div className="review-list">
        {item.review.events.map((event: any) => (
          <article className="panel review-card" key={event.event_id}>
            <div className="review-head">
              <div>
                <span className="eyebrow">Review event {event.sequence}</span>
                <h3>{event.decision.replaceAll("-", " ")}</h3>
              </div>
              <Pill value={event.after_task_status} />
            </div>
            <div className="transition-grid">
              <div><span>Observation</span><strong>{event.before_observation_status} to {event.after_observation_status}</strong></div>
              <div><span>DiagnosticReport</span><strong>{event.before_report_status} to {event.after_report_status}</strong></div>
              <div><span>Task</span><strong>{event.before_task_status} to {event.after_task_status}</strong></div>
            </div>
            <p><strong>Reason:</strong> {event.reason}</p>
            <p><strong>Note:</strong> {event.note}</p>
            <footer>
              <span>{event.reviewer_role}</span>
              <code>{event.review_provenance_reference}</code>
            </footer>
          </article>
        ))}
      </div>
      {item.review.correction_required_preserved ? (
        <Alert tone="warn">
          The correction-required/on-hold intermediate state was written and read back before rejection.
        </Alert>
      ) : null}
      <Alert>
        The reviewer identity is explicitly synthetic. This demonstrates workflow mechanics, not clinician agreement.
      </Alert>
    </>
  );
}

function FHIRAudit({ data, item }: any) {
  const references = [
    ...item.fhir.source_context_resources,
    ...Object.values(item.fhir.generated_resources)
  ];
  const available = references.filter(
    (reference: any) => data.representative_fhir_resources[reference]
  );
  const [selected, setSelected] = useState(
    available[0] || Object.keys(data.representative_fhir_resources)[0]
  );
  const resource = data.representative_fhir_resources[selected];

  return (
    <>
      <Header
        icon={<FileJson2 />}
        title="FHIR audit"
        subtitle="Linked resources, JSON, validation, transaction, and read-back evidence."
      />
      <div className="metric-grid">
        <Metric label="FHIR release" value={data.project.fhir_version} />
        <Metric label="Validation" value={data.summary_metrics.fhir_validation} />
        <Metric label="Transactions" value={data.summary_metrics.transactions} />
        <Metric label="Entries" value={data.summary_metrics.transaction_entries} />
      </div>
      <div className="audit-layout">
        <section className="panel resource-list">
          <span className="eyebrow">Case resource graph</span>
          <h3>{item.display_name}</h3>
          {references.map((reference: any) => (
            <button
              type="button"
              key={reference}
              className={selected === reference ? "active" : ""}
              onClick={() => setSelected(reference)}
            >
              <Database size={16} />
              <span>{reference}</span>
            </button>
          ))}
        </section>
        <section className="panel json-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Representative FHIR JSON</span>
              <h3>{selected}</h3>
            </div>
            <Pill value="Archived executed evidence" tone="good" />
          </div>
          <pre>
            {JSON.stringify(
              resource || {
                note: "This reference is present in the executed Bundle evidence but is not copied into the compact viewer payload."
              },
              null,
              2
            )}
          </pre>
        </section>
      </div>
      <Alert>
        The tested workflow passed server validation, transaction write-back, direct read-back, and critical-field preservation in the public HAPI FHIR R4 sandbox.
      </Alert>
    </>
  );
}

export default function App() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState("launch");
  const [selectedCaseId, setSelectedCaseId] = useState("stable");

  useEffect(() => {
    fetch("./data/app_data.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setData)
      .catch((reason) => setError(String(reason)));
  }, []);

  const selectedCase = useMemo(
    () => data?.cases.find((item: any) => item.case_id === selectedCaseId),
    [data, selectedCaseId]
  );

  if (error) {
    return <main className="load-state"><h1>Application data failed to load</h1><pre>{error}</pre></main>;
  }
  if (!data || !selectedCase) {
    return <main className="load-state"><div className="spinner" /><p>Loading NeuroFHIR-QC evidence...</p></main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <BrainCircuit size={28} />
          <div><strong>NeuroFHIR-QC</strong><small>Reviewer application</small></div>
        </div>
        <nav>
          {screens.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                type="button"
                key={entry.id}
                className={screen === entry.id ? "active" : ""}
                onClick={() => setScreen(entry.id)}
              >
                <Icon size={18} />
                <span>{entry.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <Pill value="Research MVP" tone="neutral" />
          <small>{data.project.data_boundary}</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="case-selector">
            {data.cases.map((item: any) => (
              <button
                type="button"
                key={item.case_id}
                className={selectedCaseId === item.case_id ? "active" : ""}
                onClick={() => setSelectedCaseId(item.case_id)}
              >
                <span>{item.display_name}</span>
                <small>{item.qc.category}</small>
              </button>
            ))}
          </div>
          <a className="repo-link" href={data.project.repository_url}>Repository</a>
        </header>

        <div className="screen-content">
          {screen === "launch" ? <Launch data={data} item={selectedCase} /> : null}
          {screen === "timeline" ? <Timeline item={selectedCase} /> : null}
          {screen === "mri" ? <MRIReview item={selectedCase} /> : null}
          {screen === "longitudinal" ? <Longitudinal item={selectedCase} /> : null}
          {screen === "review" ? <HumanReview data={data} item={selectedCase} onOpenFHIR={() => setScreen("fhir")} /> : null}
          {screen === "fhir" ? <FHIRAudit data={data} item={selectedCase} /> : null}
        </div>
      </main>
    </div>
  );
}
