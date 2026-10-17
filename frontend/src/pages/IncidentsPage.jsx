import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import FilterTabs from '../components/common/FilterTabs.jsx';
import Badge from '../components/common/Badge.jsx';
import DataTable from '../components/common/DataTable.jsx';
import FormModal from '../components/common/FormModal.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { AsyncView } from '../components/common/StateViews.jsx';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import { incidentsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { INCIDENT_TYPES, INCIDENT_STATUS, PRIORITIES, ZONES, WRITE_ROLES, DELETE_ROLES, opts } from '../config/constants.js';
import { formatDateTime } from '../utils/format.js';

const FIELDS = [
  { name: 'title', label: 'Title', required: true, full: true },
  { name: 'type', label: 'Incident type', type: 'select', required: true, options: opts(INCIDENT_TYPES), defaultValue: 'Others' },
  { name: 'priority', label: 'Priority', type: 'select', required: true, options: opts(PRIORITIES), defaultValue: 'Medium' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: opts(INCIDENT_STATUS), defaultValue: 'Pending' },
  { name: 'occurredAt', label: 'Date and time', type: 'datetime-local', required: true, defaultValue: new Date().toISOString() },
  { name: 'location.name', label: 'Location name' },
  { name: 'location.zone', label: 'Zone', type: 'select', options: opts(ZONES) },
  { name: 'location.lat', label: 'Latitude', type: 'number', step: 'any', min: -90, max: 90 },
  { name: 'location.lng', label: 'Longitude', type: 'number', step: 'any', min: -180, max: 180 },
  { name: 'evidenceCount', label: 'Evidence items (photos)', type: 'number', min: 0, defaultValue: 0 },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function IncidentsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const q = useDebounce(search);

  const state = useFetch(() => incidentsApi.list({ type: tab, search: q, page, limit: 10 }), [tab, q, page]);
  const items = state.data?.items || [];
  const canWrite = WRITE_ROLES.includes(user.role);
  const canDelete = DELETE_ROLES.includes(user.role);

  const save = async (payload) => {
    if (editing === 'new') await incidentsApi.create(payload);
    else {
      const updated = await incidentsApi.update(editing._id, payload);
      if (selected?._id === updated._id) setSelected(updated);
    }
    notify('Incident saved');
    setEditing(null);
    state.reload();
  };

  const setStatus = async (status) => {
    try {
      const updated = await incidentsApi.update(selected._id, { status });
      setSelected(updated);
      notify(`Status changed to ${status}`);
      state.reload();
    } catch (e) { notify(e.message, 'error'); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete incident ${selected.incidentId}?`)) return;
    try { await incidentsApi.remove(selected._id); setSelected(null); notify('Incident deleted'); state.reload(); } catch (e) { notify(e.message, 'error'); }
  };

  const columns = [
    { key: 'incidentId', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'location', label: 'Location', render: (r) => r.location?.name || '-' },
    { key: 'occurredAt', label: 'Date and time', render: (r) => formatDateTime(r.occurredAt) },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    { key: 'priority', label: 'Priority', render: (r) => <Badge value={r.priority} /> },
    { key: 'evidenceCount', label: 'Evidence', render: (r) => `${r.evidenceCount} item${r.evidenceCount === 1 ? '' : 's'}` },
  ];

  return (
    <>
      <PageHeader title="Incident Intelligence" subtitle="Record, verify and track incidents across the reserve">
        {canWrite && <button type="button" className="btn btn-green" onClick={() => setEditing('new')}><Plus size={16} /> Add incident</button>}
      </PageHeader>

      <FilterTabs options={['All', ...INCIDENT_TYPES]} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />
      <div className="toolbar">
        <input className="input search-input" type="search" aria-label="Search incidents" placeholder="Search incidents..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <AsyncView state={state} isEmpty={items.length === 0} emptyText="No incidents match the selected filters.">
        <section className="card card-flush">
          <DataTable columns={columns} rows={items} onRowClick={setSelected} selectedId={selected?._id} />
          <Pagination page={state.data?.page || 1} pages={state.data?.pages || 1} total={state.data?.total || 0} onChange={setPage} />
        </section>
      </AsyncView>

      {selected && (
        <section className="card" style={{ marginTop: '1rem' }}>
          <div className="card-head">
            <h2>{selected.incidentId} - {selected.title}</h2>
            <div className="page-actions">
              {canWrite && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(selected)}><Pencil size={14} /> Edit</button>}
              {canDelete && <button type="button" className="btn btn-danger btn-sm" onClick={remove}><Trash2 size={14} /> Delete</button>}
            </div>
          </div>
          <div className="card-body">
            <dl className="kv">
              <dt>Type</dt><dd>{selected.type}</dd>
              <dt>Location</dt><dd>{selected.location?.name || '-'}{selected.location?.zone ? ` (${selected.location.zone})` : ''}</dd>
              <dt>Coordinates</dt><dd>{selected.location?.lat != null ? `${selected.location.lat}, ${selected.location.lng}` : 'Not recorded'}</dd>
              <dt>Occurred</dt><dd>{formatDateTime(selected.occurredAt)}</dd>
              <dt>Priority</dt><dd><Badge value={selected.priority} /></dd>
              <dt>Status</dt>
              <dd>
                {canWrite ? (
                  <select className="select" aria-label="Change status" value={selected.status} onChange={(e) => setStatus(e.target.value)}>
                    {INCIDENT_STATUS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : <Badge value={selected.status} />}
              </dd>
              <dt>Description</dt><dd>{selected.description || 'No description provided.'}</dd>
            </dl>
          </div>
        </section>
      )}

      {editing && <FormModal title={editing === 'new' ? 'Add incident' : `Edit ${editing.incidentId}`} fields={FIELDS} initialValues={editing === 'new' ? {} : editing} onSubmit={save} onClose={() => setEditing(null)} />}
    </>
  );
}
