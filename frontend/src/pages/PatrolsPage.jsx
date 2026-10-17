import { useState } from 'react';
import { Plus, Trash2, Route, Footprints, PawPrint } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatCard from '../components/common/StatCard.jsx';
import Badge from '../components/common/Badge.jsx';
import FormModal from '../components/common/FormModal.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { AsyncView } from '../components/common/StateViews.jsx';
import ForestMap from '../components/map/ForestMap.jsx';
import { defaultVisibility } from '../components/map/layers.js';
import useFetch from '../hooks/useFetch.js';
import { patrolsApi, dashboardApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PATROL_STATUS, ZONES, WRITE_ROLES, DELETE_ROLES, opts } from '../config/constants.js';
import { formatDate } from '../utils/format.js';

const MAP_ONLY_PATROLS = { ...Object.fromEntries(Object.keys(defaultVisibility()).map((k) => [k, false])), patrols: true, core: true, reserve: true };

const FIELDS = [
  { name: 'name', label: 'Route name', required: true, full: true, placeholder: 'e.g. Route F - Kolsa Ridge' },
  { name: 'zone', label: 'Zone', type: 'select', required: true, options: opts(ZONES), defaultValue: 'Core Zone' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: opts(PATROL_STATUS), defaultValue: 'Planned' },
  { name: 'date', label: 'Patrol date', type: 'date', required: true, defaultValue: new Date().toISOString() },
  { name: 'distanceKm', label: 'Distance (km)', type: 'number', min: 0, step: '0.1' },
  { name: 'observationsCount', label: 'Observations recorded', type: 'number', min: 0 },
  { name: 'team', label: 'Patrol team' },
  { name: 'waypoints', label: 'Waypoints (optional)', type: 'textarea', hint: 'One "latitude, longitude" pair per line to draw the route on the map.', placeholder: '20.27, 79.36\n20.24, 79.40' },
];

function parseWaypoints(text) {
  if (!text) return [];
  return text.split('\n').map((l) => l.split(',').map((n) => Number(n.trim()))).filter((p) => p.length === 2 && p.every((n) => Number.isFinite(n)));
}

export default function PatrolsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const list = useFetch(() => patrolsApi.list({ page, limit: 8 }), [page]);
  const all = useFetch(() => patrolsApi.list({ limit: 100, days: 30 }), []);
  const layers = useFetch(() => dashboardApi.mapLayers({ days: 90 }), []);

  const reloadAll = () => { list.reload(); all.reload(); layers.reload(); };
  const monthly = all.data?.items || [];
  const totals = {
    distance: monthly.reduce((a, p) => a + (p.distanceKm || 0), 0),
    routes: monthly.length,
    observations: monthly.reduce((a, p) => a + (p.observationsCount || 0), 0),
  };

  const save = async ({ waypoints, ...payload }) => {
    const path = parseWaypoints(waypoints);
    await patrolsApi.create({ ...payload, path });
    notify('Patrol added');
    setAdding(false);
    reloadAll();
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try { await patrolsApi.remove(p._id); notify('Patrol deleted'); reloadAll(); } catch (e) { notify(e.message, 'error'); }
  };

  const items = list.data?.items || [];
  return (
    <>
      <PageHeader title="Patrol Activity" subtitle="Routes covered, distance travelled and observations recorded">
        {WRITE_ROLES.includes(user.role) && <button type="button" className="btn btn-green" onClick={() => setAdding(true)}><Plus size={16} /> Add patrol</button>}
      </PageHeader>

      <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
        <StatCard icon={Route} value={`${totals.distance.toFixed(0)} km`} label="Distance covered (30 days)" />
        <StatCard icon={Footprints} value={totals.routes} label="Patrol routes (30 days)" tone="info" />
        <StatCard icon={PawPrint} value={totals.observations} label="Observations from patrols" tone="warn" />
      </div>

      <div className="grid grid-main">
        <section className="card card-flush">
          <div className="card-head"><h2>Patrol routes (last 90 days)</h2></div>
          <AsyncView state={layers}><ForestMap data={layers.data} visible={MAP_ONLY_PATROLS} height={420} /></AsyncView>
          <div className="legend">
            <span><span className="dot" style={{ background: '#e8821a' }} />Completed</span>
            <span><span className="dot" style={{ background: '#b3261e' }} />In progress</span>
            <span><span className="dot" style={{ background: '#566879' }} />Planned</span>
          </div>
        </section>

        <section className="card card-flush">
          <div className="card-head"><h2>Recent patrols</h2></div>
          <AsyncView state={list} isEmpty={items.length === 0} emptyText="No patrols recorded.">
            <ul className="list">
              {items.map((p) => (
                <li key={p._id}>
                  <div>
                    <div className="title">{p.name}</div>
                    <div className="small muted">{formatDate(p.date)} - {p.distanceKm} km - {p.observationsCount} observations</div>
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                    <Badge value={p.status} />
                    {DELETE_ROLES.includes(user.role) && <button type="button" className="icon-btn" aria-label={`Delete ${p.name}`} onClick={() => remove(p)}><Trash2 size={16} /></button>}
                  </div>
                </li>
              ))}
            </ul>
            {list.data && <Pagination page={list.data.page} pages={list.data.pages} total={list.data.total} onChange={setPage} />}
          </AsyncView>
        </section>
      </div>
      {adding && <FormModal title="Add patrol" fields={FIELDS} onSubmit={save} onClose={() => setAdding(false)} />}
    </>
  );
}
