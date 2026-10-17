import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import FilterTabs from '../components/common/FilterTabs.jsx';
import Badge from '../components/common/Badge.jsx';
import Modal from '../components/common/Modal.jsx';
import FormModal from '../components/common/FormModal.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { AsyncView } from '../components/common/StateViews.jsx';
import useFetch from '../hooks/useFetch.js';
import { alertsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { INCIDENT_TYPES, PRIORITIES, ZONES, ALERT_STATUS, WRITE_ROLES, opts } from '../config/constants.js';
import { formatDateTime, timeAgo } from '../utils/format.js';

const NEW_FIELDS = [
  { name: 'title', label: 'Alert title', required: true, full: true },
  { name: 'type', label: 'Type', type: 'select', required: true, options: opts(INCIDENT_TYPES), defaultValue: 'Others' },
  { name: 'severity', label: 'Severity', type: 'select', required: true, options: opts(PRIORITIES), defaultValue: 'Medium' },
  { name: 'location.name', label: 'Location name' },
  { name: 'location.zone', label: 'Zone', type: 'select', options: opts(ZONES) },
  { name: 'location.lat', label: 'Latitude', type: 'number', step: 'any' },
  { name: 'location.lng', label: 'Longitude', type: 'number', step: 'any' },
];

function ReviewDialog({ alert, onClose, onDone }) {
  const { notify } = useToast();
  const [status, setStatus] = useState('Reviewed');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await alertsApi.review(alert._id, { status, note });
      notify(status === 'Escalated' ? 'Alert escalated to a new incident' : `Alert marked ${status.toLowerCase()}`);
      onDone();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Modal title="Review alert" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <dl className="kv" style={{ marginBottom: '1rem' }}>
          <dt>Alert</dt><dd>{alert.title}</dd>
          <dt>Location</dt><dd>{alert.location?.name || '-'}</dd>
          <dt>Raised</dt><dd>{formatDateTime(alert.raisedAt)}</dd>
          <dt>Severity</dt><dd><Badge value={alert.severity} /></dd>
        </dl>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="decision">Decision</label>
            <select id="decision" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Reviewed">Reviewed - no further action</option>
              <option value="Dismissed">Dismissed - false alarm</option>
              <option value="Escalated">Escalate - open an incident</option>
            </select>
          </div>
          <div className="field full">
            <label htmlFor="note">Review note</label>
            <textarea id="note" className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-green" disabled={busy}>{busy ? 'Saving...' : 'Submit review'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AlertsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('Open');
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState(null);
  const [adding, setAdding] = useState(false);
  const canWrite = WRITE_ROLES.includes(user.role);

  const state = useFetch(() => alertsApi.list({ severity, status, page, limit: 10 }), [severity, status, page]);
  const items = state.data?.items || [];

  const create = async (payload) => { await alertsApi.create(payload); notify('Alert raised'); setAdding(false); state.reload(); };

  return (
    <>
      <PageHeader title="Alerts and Review Queue" subtitle="Review each alert, then close it or escalate it as an incident">
        {canWrite && <button type="button" className="btn btn-green" onClick={() => setAdding(true)}><Plus size={16} /> Raise alert</button>}
      </PageHeader>

      <FilterTabs options={['All', ...PRIORITIES]} value={severity} onChange={(v) => { setSeverity(v); setPage(1); }} />
      <div className="toolbar">
        <label htmlFor="alert-status" className="small muted">Status</label>
        <select id="alert-status" className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="All">All</option>
          {ALERT_STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <AsyncView state={state} isEmpty={items.length === 0} emptyText="No alerts match the selected filters.">
        <section className="card card-flush">
          <ul className="list">
            {items.map((a) => (
              <li key={a._id}>
                <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center' }}>
                  <AlertTriangle size={22} color={a.severity === 'High' ? '#b3261e' : a.severity === 'Medium' ? '#9a5b00' : '#17599f'} aria-hidden="true" />
                  <div>
                    <div className="title">{a.title}</div>
                    <div className="small muted">{a.location?.name || 'Location not recorded'} - {timeAgo(a.raisedAt)}</div>
                    {a.reviewNote && <div className="small">Note: {a.reviewNote}{a.reviewedBy ? ` (${a.reviewedBy.name})` : ''}</div>}
                    {a.linkedIncident && <div className="small">Escalated as {a.linkedIncident.incidentId}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <Badge value={a.severity} />
                  <Badge value={a.status} />
                  {a.status === 'Open' && canWrite && <button type="button" className="btn btn-sm" onClick={() => setReviewing(a)}>Review</button>}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={state.data?.page || 1} pages={state.data?.pages || 1} total={state.data?.total || 0} onChange={setPage} />
        </section>
      </AsyncView>

      {reviewing && <ReviewDialog alert={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); state.reload(); }} />}
      {adding && <FormModal title="Raise alert" fields={NEW_FIELDS} onSubmit={create} onClose={() => setAdding(false)} />}
    </>
  );
}
