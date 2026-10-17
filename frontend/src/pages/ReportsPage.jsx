import { Fragment, useState } from 'react';
import { FilePlus, Printer, Trash2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import FormModal from '../components/common/FormModal.jsx';
import { AsyncView } from '../components/common/StateViews.jsx';
import useFetch from '../hooks/useFetch.js';
import { reportsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { REPORT_TYPES, WRITE_ROLES, DELETE_ROLES, opts } from '../config/constants.js';
import { formatDate, formatDateTime, toInputDate } from '../utils/format.js';

const FIELDS = [
  { name: 'type', label: 'Report type', type: 'select', required: true, options: opts(REPORT_TYPES), defaultValue: 'Monthly Summary', full: true },
  { name: 'from', label: 'From', type: 'date', required: true, defaultValue: new Date(Date.now() - 30 * 86400000).toISOString() },
  { name: 'to', label: 'To', type: 'date', required: true, defaultValue: new Date().toISOString() },
];

function Breakdown({ title, data }) {
  const entries = Object.entries(data || {});
  return (
    <div>
      <h3 style={{ marginBottom: '.4rem' }}>{title}</h3>
      {entries.length === 0 ? <p className="small muted">No records in this period.</p> : (
        <dl className="kv">{entries.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}</dl>
      )}
    </div>
  );
}

function ReportView({ report, onClose }) {
  const t = report.summary?.totals || {};
  return (
    <Modal title={report.title} onClose={onClose} wide>
      <p className="small muted">Period: {formatDate(report.periodStart)} to {formatDate(report.periodEnd)} - Generated {formatDateTime(report.createdAt)}{report.generatedBy ? ` by ${report.generatedBy.name}` : ''}</p>
      <dl className="kv" style={{ margin: '1rem 0' }}>
        <dt>Observations</dt><dd>{t.observations}</dd>
        <dt>Incidents</dt><dd>{t.incidents}</dd>
        <dt>Alerts</dt><dd>{t.alerts}</dd>
        <dt>Patrol routes</dt><dd>{t.patrolRoutes}</dd>
        <dt>Patrol distance</dt><dd>{(t.patrolDistanceKm || 0).toFixed(1)} km</dd>
      </dl>
      <div className="grid grid-2">
        <Breakdown title="Observations by species" data={report.summary?.observationsBySpecies} />
        <Breakdown title="Incidents by type" data={report.summary?.incidentsByType} />
        <Breakdown title="Incidents by status" data={report.summary?.incidentsByStatus} />
        <Breakdown title="Alerts by severity" data={report.summary?.alertsBySeverity} />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print / save as PDF</button>
        <button type="button" className="btn" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [generating, setGenerating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const state = useFetch(() => reportsApi.list({ limit: 50 }), []);
  const rows = state.data?.items || [];

  const generate = async (payload) => {
    const report = await reportsApi.generate(payload);
    notify('Report generated');
    setGenerating(false);
    setViewing(report);
    state.reload();
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete "${r.title}"?`)) return;
    try { await reportsApi.remove(r._id); notify('Report deleted'); state.reload(); } catch (e) { notify(e.message, 'error'); }
  };

  const columns = [
    { key: 'title', label: 'Report' },
    { key: 'type', label: 'Type' },
    { key: 'period', label: 'Period', render: (r) => `${toInputDate(r.periodStart)} to ${toInputDate(r.periodEnd)}` },
    { key: 'createdAt', label: 'Generated', render: (r) => formatDateTime(r.createdAt) },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div style={{ display: 'flex', gap: '.4rem' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewing(r)}>View</button>
        {DELETE_ROLES.includes(user.role) && <button type="button" className="icon-btn" aria-label={`Delete ${r.title}`} onClick={() => remove(r)}><Trash2 size={16} /></button>}
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate summaries from recorded observations, incidents, alerts and patrols">
        {WRITE_ROLES.includes(user.role) && <button type="button" className="btn btn-green" onClick={() => setGenerating(true)}><FilePlus size={16} /> Generate report</button>}
      </PageHeader>
      <AsyncView state={state} isEmpty={rows.length === 0} emptyText="No reports generated yet.">
        <section className="card card-flush"><DataTable columns={columns} rows={rows} /></section>
      </AsyncView>
      {generating && <FormModal title="Generate report" submitLabel="Generate" fields={FIELDS} onSubmit={generate} onClose={() => setGenerating(false)} />}
      {viewing && <ReportView report={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
