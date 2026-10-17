import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import FilterTabs from '../components/common/FilterTabs.jsx';
import Badge from '../components/common/Badge.jsx';
import DataTable from '../components/common/DataTable.jsx';
import FormModal from '../components/common/FormModal.jsx';
import { AsyncView } from '../components/common/StateViews.jsx';
import useFetch from '../hooks/useFetch.js';
import { datasetsApi, modelsApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DATA_STATUS, MODEL_STATUS, DATA_ROLES, opts } from '../config/constants.js';
import { formatDate, formatNumber } from '../utils/format.js';

const DATASET_FIELDS = [
  { name: 'name', label: 'Dataset name', required: true, full: true },
  { name: 'type', label: 'Type', placeholder: 'e.g. Remote Sensing' },
  { name: 'source', label: 'Source' },
  { name: 'records', label: 'Records', type: 'number', min: 0 },
  { name: 'coverage', label: 'Coverage' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: opts(DATA_STATUS), defaultValue: 'Active' },
];

const MODEL_FIELDS = [
  { name: 'name', label: 'Model name', required: true, full: true },
  { name: 'version', label: 'Version', defaultValue: 'v0.1' },
  { name: 'accuracy', label: 'Accuracy (%)', type: 'number', min: 0, max: 100, step: '0.1' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: opts(MODEL_STATUS), defaultValue: 'Testing' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function DataModelsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [tab, setTab] = useState('Datasets');
  const [adding, setAdding] = useState(false);
  const isDatasets = tab === 'Datasets';
  const api = isDatasets ? datasetsApi : modelsApi;
  const canEdit = DATA_ROLES.includes(user.role);

  const state = useFetch(() => api.list({ limit: 100 }), [tab]);
  const rows = state.data?.items || [];

  const save = async (payload) => { await api.create(payload); notify(`${isDatasets ? 'Dataset' : 'Model'} added`); setAdding(false); state.reload(); };
  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.name}?`)) return;
    try { await api.remove(r._id); notify('Deleted'); state.reload(); } catch (e) { notify(e.message, 'error'); }
  };

  const actions = canEdit ? [{ key: 'actions', label: 'Actions', render: (r) => <button type="button" className="icon-btn" aria-label={`Delete ${r.name}`} onClick={() => remove(r)}><Trash2 size={16} /></button> }] : [];
  const datasetColumns = [
    { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }, { key: 'source', label: 'Source' },
    { key: 'records', label: 'Records', render: (r) => (r.records ? formatNumber(r.records) : '-') },
    { key: 'coverage', label: 'Coverage' },
    { key: 'updatedAt', label: 'Last updated', render: (r) => formatDate(r.updatedAt) },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> }, ...actions,
  ];
  const modelColumns = [
    { key: 'name', label: 'Model' }, { key: 'version', label: 'Version' },
    { key: 'accuracy', label: 'Accuracy', render: (r) => `${r.accuracy}%` },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    { key: 'description', label: 'Description' }, ...actions,
  ];

  return (
    <>
      <PageHeader title="Datasets and Models" subtitle="Registry of data sources and analytical models used by the portal">
        {canEdit && <button type="button" className="btn btn-green" onClick={() => setAdding(true)}><Plus size={16} /> Add {isDatasets ? 'dataset' : 'model'}</button>}
      </PageHeader>
      <FilterTabs options={['Datasets', 'Models']} value={tab} onChange={setTab} />
      <AsyncView state={state} isEmpty={rows.length === 0} emptyText={`No ${tab.toLowerCase()} registered yet.`}>
        <section className="card card-flush"><DataTable columns={isDatasets ? datasetColumns : modelColumns} rows={rows} /></section>
      </AsyncView>
      {adding && <FormModal title={`Add ${isDatasets ? 'dataset' : 'model'}`} fields={isDatasets ? DATASET_FIELDS : MODEL_FIELDS} onSubmit={save} onClose={() => setAdding(false)} />}
    </>
  );
}
