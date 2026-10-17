import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import FilterTabs from '../components/common/FilterTabs.jsx';
import FormModal from '../components/common/FormModal.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { AsyncView } from '../components/common/StateViews.jsx';
import useFetch from '../hooks/useFetch.js';
import useDebounce from '../hooks/useDebounce.js';
import { observationsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { SPECIES_CATEGORIES, OBSERVATION_SOURCES, ZONES, WRITE_ROLES, DELETE_ROLES, opts } from '../config/constants.js';
import { timeAgo } from '../utils/format.js';

const FIELDS = [
  { name: 'species', label: 'Species', required: true, placeholder: 'e.g. Tiger' },
  { name: 'category', label: 'Category', type: 'select', required: true, options: opts(SPECIES_CATEGORIES), defaultValue: 'Others' },
  { name: 'confidence', label: 'Confidence (%)', type: 'number', min: 0, max: 100, defaultValue: 100 },
  { name: 'source', label: 'Source', type: 'select', required: true, options: opts(OBSERVATION_SOURCES), defaultValue: 'Manual Entry' },
  { name: 'location.name', label: 'Location name' },
  { name: 'location.zone', label: 'Zone', type: 'select', options: opts(ZONES) },
  { name: 'location.lat', label: 'Latitude', type: 'number', step: 'any', min: -90, max: 90 },
  { name: 'location.lng', label: 'Longitude', type: 'number', step: 'any', min: -180, max: 180 },
  { name: 'observedAt', label: 'Observed at', type: 'datetime-local', required: true, defaultValue: new Date().toISOString() },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export default function ObservationsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [days, setDays] = useState('30');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | observation
  const q = useDebounce(search);

  const state = useFetch(() => observationsApi.list({ category: tab, search: q, days, page, limit: 12 }), [tab, q, days, page]);
  const canWrite = WRITE_ROLES.includes(user.role);
  const canDelete = DELETE_ROLES.includes(user.role);

  const save = async (payload) => {
    if (editing === 'new') await observationsApi.create(payload);
    else await observationsApi.update(editing._id, payload);
    notify('Observation saved');
    setEditing(null);
    state.reload();
  };

  const remove = async (o) => {
    if (!window.confirm(`Delete observation of ${o.species}?`)) return;
    try { await observationsApi.remove(o._id); notify('Observation deleted'); state.reload(); } catch (e) { notify(e.message, 'error'); }
  };

  const items = state.data?.items || [];
  return (
    <>
      <PageHeader title="Animal Observations" subtitle="Sightings from camera traps, patrols and manual entries">
        {canWrite && <button type="button" className="btn btn-green" onClick={() => setEditing('new')}><Plus size={16} /> Add observation</button>}
      </PageHeader>

      <FilterTabs options={['All', ...SPECIES_CATEGORIES]} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />
      <div className="toolbar">
        <input className="input search-input" type="search" aria-label="Search observations" placeholder="Search species, location..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="select" aria-label="Time range" value={days} onChange={(e) => { setDays(e.target.value); setPage(1); }}>
          <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="">All time</option>
        </select>
      </div>

      <AsyncView state={state} isEmpty={items.length === 0} emptyText="No observations match the selected filters.">
        <div className="obs-grid">
          {items.map((o) => (
            <article key={o._id} className="card obs-card">
              <div className="obs-top">
                <div className="obs-avatar" aria-hidden="true">{o.species.charAt(0)}</div>
                <span className="badge badge-ok">{o.confidence}%</span>
              </div>
              <div className="obs-body">
                <h3>{o.species}</h3>
                <div className="small muted">{o.location?.name || 'Location not recorded'}{o.location?.zone ? ` (${o.location.zone})` : ''}</div>
                <div className="small muted">{timeAgo(o.observedAt)} - {o.source}</div>
              </div>
              {(canWrite || canDelete) && (
                <div className="obs-actions">
                  {canWrite && <button type="button" className="icon-btn" aria-label={`Edit ${o.species}`} onClick={() => setEditing(o)}><Pencil size={17} /></button>}
                  {canDelete && <button type="button" className="icon-btn" aria-label={`Delete ${o.species}`} onClick={() => remove(o)}><Trash2 size={17} /></button>}
                </div>
              )}
            </article>
          ))}
        </div>
        {state.data && <div className="card" style={{ marginTop: '1rem' }}><Pagination page={state.data.page} pages={state.data.pages} total={state.data.total} onChange={setPage} /></div>}
      </AsyncView>

      {editing && (
        <FormModal title={editing === 'new' ? 'Add observation' : 'Edit observation'} fields={FIELDS} initialValues={editing === 'new' ? {} : editing} onSubmit={save} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
