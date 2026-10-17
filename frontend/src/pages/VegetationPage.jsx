import { useState } from 'react';
import { Plus, Trash2, Leaf, Trees, Sprout } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatCard from '../components/common/StatCard.jsx';
import Badge from '../components/common/Badge.jsx';
import DataTable from '../components/common/DataTable.jsx';
import FormModal from '../components/common/FormModal.jsx';
import { AsyncView } from '../components/common/StateViews.jsx';
import useFetch from '../hooks/useFetch.js';
import { vegetationApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ZONES, HEALTH_STATUS, WRITE_ROLES, DELETE_ROLES, opts } from '../config/constants.js';
import { formatDate } from '../utils/format.js';

const FIELDS = [
  { name: 'area', label: 'Area / block', required: true },
  { name: 'zone', label: 'Zone', type: 'select', required: true, options: opts(ZONES), defaultValue: 'Core Zone' },
  { name: 'ndvi', label: 'NDVI (-1 to 1)', type: 'number', step: '0.01', min: -1, max: 1, required: true },
  { name: 'canopyCover', label: 'Canopy cover (%)', type: 'number', min: 0, max: 100 },
  { name: 'habitatSuitability', label: 'Habitat suitability (%)', type: 'number', min: 0, max: 100 },
  { name: 'health', label: 'Vegetation health', type: 'select', required: true, options: opts(HEALTH_STATUS), defaultValue: 'Healthy' },
  { name: 'source', label: 'Data source', defaultValue: 'Sentinel-2' },
  { name: 'recordedAt', label: 'Recorded on', type: 'date', required: true, defaultValue: new Date().toISOString() },
];

const avg = (rows, key) => (rows.length ? rows.reduce((a, r) => a + (r[key] || 0), 0) / rows.length : 0);

export default function VegetationPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [adding, setAdding] = useState(false);
  const state = useFetch(() => vegetationApi.list({ limit: 100 }), []);
  const rows = state.data?.items || [];

  const save = async (payload) => { await vegetationApi.create(payload); notify('Record added'); setAdding(false); state.reload(); };
  const remove = async (r) => {
    if (!window.confirm(`Delete record for ${r.area}?`)) return;
    try { await vegetationApi.remove(r._id); notify('Record deleted'); state.reload(); } catch (e) { notify(e.message, 'error'); }
  };

  const columns = [
    { key: 'area', label: 'Area' },
    { key: 'zone', label: 'Zone' },
    { key: 'ndvi', label: 'NDVI', render: (r) => r.ndvi.toFixed(2) },
    { key: 'canopyCover', label: 'Canopy cover', render: (r) => (
      <div style={{ minWidth: 110 }}><div className="small">{r.canopyCover}%</div><div className="bar"><span style={{ width: `${r.canopyCover}%` }} /></div></div>
    ) },
    { key: 'habitatSuitability', label: 'Habitat suitability', render: (r) => `${r.habitatSuitability}%` },
    { key: 'health', label: 'Health', render: (r) => <Badge value={r.health} /> },
    { key: 'recordedAt', label: 'Recorded', render: (r) => formatDate(r.recordedAt) },
    ...(DELETE_ROLES.includes(user.role) ? [{ key: 'actions', label: 'Actions', render: (r) => <button type="button" className="icon-btn" aria-label={`Delete ${r.area}`} onClick={() => remove(r)}><Trash2 size={17} /></button> }] : []),
  ];

  return (
    <>
      <PageHeader title="Vegetation Analysis" subtitle="Habitat condition derived from satellite indices and field surveys">
        {WRITE_ROLES.includes(user.role) && <button type="button" className="btn btn-green" onClick={() => setAdding(true)}><Plus size={16} /> Add record</button>}
      </PageHeader>
      <AsyncView state={state} isEmpty={rows.length === 0} emptyText="No vegetation records yet.">
        <div className="grid">
          <div className="grid grid-3">
            <StatCard icon={Leaf} value={avg(rows, 'ndvi').toFixed(2)} label="Average NDVI" />
            <StatCard icon={Trees} value={`${avg(rows, 'canopyCover').toFixed(0)}%`} label="Average canopy cover" tone="info" />
            <StatCard icon={Sprout} value={`${avg(rows, 'habitatSuitability').toFixed(0)}%`} label="Average habitat suitability" tone="warn" />
          </div>
          <section className="card card-flush"><DataTable columns={columns} rows={rows} /></section>
        </div>
      </AsyncView>
      {adding && <FormModal title="Add vegetation record" fields={FIELDS} onSubmit={save} onClose={() => setAdding(false)} />}
    </>
  );
}
