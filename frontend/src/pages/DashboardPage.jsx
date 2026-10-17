import { Link } from 'react-router-dom';
import { Camera, PawPrint, Footprints, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import StatCard from '../components/common/StatCard.jsx';
import Badge from '../components/common/Badge.jsx';
import { AsyncView, EmptyState } from '../components/common/StateViews.jsx';
import ForestMap from '../components/map/ForestMap.jsx';
import { LAYER_DEFS, defaultVisibility } from '../components/map/layers.js';
import useFetch from '../hooks/useFetch.js';
import { dashboardApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { timeAgo } from '../utils/format.js';

const MAP_LEGEND = ['observations', 'incidents', 'patrols', 'camera_node'];
const VISIBLE = { ...defaultVisibility(), village: false, water_body: false, gate: false };

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useFetch(() => dashboardApi.summary(), []);
  const layers = useFetch(() => dashboardApi.mapLayers({ days: 30 }), []);
  const s = summary.data;

  return (
    <>
      <PageHeader title={`Welcome, ${user?.name}`} subtitle="Tadoba Andhari Tiger Reserve - overview of monitoring activity" />
      <AsyncView state={summary}>
        {s && (
          <div className="grid">
            <div className="grid grid-4">
              <StatCard icon={Camera} value={s.stats.cameraNodes} label="Camera nodes active" />
              <StatCard icon={PawPrint} value={s.stats.sightings} label="Animal sightings (last 7 days)" tone="info" />
              <StatCard icon={Footprints} value={s.stats.patrols} label="Patrol routes this month" />
              <StatCard icon={AlertTriangle} value={s.stats.flaggedAreas} label="Flagged areas needing attention" tone="danger" />
            </div>

            <div className="grid grid-main">
              <section className="card">
                <div className="card-head"><h2>Recent activity (last 30 days)</h2><Link to="/forest-map">Open full map</Link></div>
                <AsyncView state={layers}><ForestMap data={layers.data} visible={VISIBLE} height={360} /></AsyncView>
                <div className="legend">
                  {LAYER_DEFS.filter((l) => MAP_LEGEND.includes(l.key)).map((l) => (
                    <span key={l.key}><span className="dot" style={{ background: l.color }} />{l.label}</span>
                  ))}
                </div>
              </section>

              <section className="card">
                <div className="card-head"><h2>Latest alerts</h2><Link to="/alerts">View all</Link></div>
                {s.latestAlerts.length === 0 ? <EmptyState text="No open alerts." /> : (
                  <ul className="list">
                    {s.latestAlerts.map((a) => (
                      <li key={a._id}>
                        <div><div className="title">{a.title}</div><div className="small muted">{a.location?.name} - {timeAgo(a.raisedAt)}</div></div>
                        <Badge value={a.severity} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="card">
              <div className="card-head"><h2>Recent observations</h2><Link to="/observations">View all</Link></div>
              {s.recentObservations.length === 0 ? <EmptyState /> : (
                <ul className="list">
                  {s.recentObservations.map((o) => (
                    <li key={o._id}>
                      <div><div className="title">{o.species}</div><div className="small muted">{o.location?.name} - {timeAgo(o.observedAt)}</div></div>
                      <span className="badge badge-ok">{o.confidence}% confidence</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </AsyncView>
    </>
  );
}
