import { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { colorOf } from './layers.js';
import { formatDateTime } from '../../utils/format.js';

const CENTER = [20.24, 79.33];
const ZONE_STYLE = {
  reserve: { color: '#17365d', weight: 2, dashArray: '6 6', fill: false },
  buffer: { color: '#8a9a2b', weight: 1, fillColor: '#8a9a2b', fillOpacity: 0.12 },
  core: { color: '#1f6b3c', weight: 2, fillColor: '#1f6b3c', fillOpacity: 0.2 },
};
const PATROL_COLOR = { Completed: '#e8821a', 'In Progress': '#b3261e', Planned: '#566879' };

function MapController({ targetLoc }) {
  const map = useMap();
  useEffect(() => {
    if (targetLoc && typeof targetLoc.lat === 'number' && typeof targetLoc.lng === 'number') {
      map.flyTo([targetLoc.lat, targetLoc.lng], Math.max(map.getZoom(), 12), {
        animate: true,
        duration: 0.8,
      });
    }
  }, [targetLoc, map]);
  return null;
}

export default function ForestMap({
  data,
  visible = {},
  height = 420,
  geojsonData = null,
  hoveredAnimal = null,
  onHoverAnimal = null,
  selectedAnimal = null,
  onSelectAnimal = null,
  filteredGeojsonIds = null,
}) {
  return (
    <div className="map-box" style={{ height }}>
      <MapContainer center={CENTER} zoom={10} scrollWheelZoom style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic map re-centering when an animal is hovered or searched */}
        <MapController targetLoc={hoveredAnimal || selectedAnimal} />

        {/* Zones */}
        {data?.zones?.map((z) => visible[z.key] && (
          <Polygon key={z.key} positions={z.positions} pathOptions={ZONE_STYLE[z.key]}>
            <Popup><strong>{z.name}</strong></Popup>
          </Polygon>
        ))}

        {/* Patrol routes */}
        {visible.patrols && data?.patrols?.map((p) => (
          <Polyline key={p._id} positions={p.path} pathOptions={{ color: PATROL_COLOR[p.status] || '#566879', weight: 4 }}>
            <Popup><strong>{p.name}</strong><br />{p.distanceKm} km - {p.status}</Popup>
          </Polyline>
        ))}

        {/* Map features (camera nodes, water bodies, gates, villages) */}
        {data?.features?.map((f) => visible[f.kind] && (
          <CircleMarker
            key={f._id}
            center={[f.lat, f.lng]}
            radius={f.kind === 'village' ? 6 : 7}
            pathOptions={{ color: '#fff', weight: 2, fillColor: colorOf(f.kind), fillOpacity: 0.9 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <strong>{f.name}</strong> ({f.kind})<br />Status: {f.status}
            </Tooltip>
            <Popup>
              <strong>{f.name}</strong><br />Kind: {f.kind}<br />Status: {f.status}
            </Popup>
          </CircleMarker>
        ))}

        {/* Live Animal Observations */}
        {visible.observations && data?.observations?.map((o) => {
          const lat = o.location?.lat;
          const lng = o.location?.lng;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;

          const isHovered = hoveredAnimal && (
            hoveredAnimal.id === o._id ||
            (Math.abs(hoveredAnimal.lat - lat) < 0.0001 && Math.abs(hoveredAnimal.lng - lng) < 0.0001)
          );

          const animalPayload = {
            id: o._id,
            species: o.species,
            scientificName: o.species,
            category: o.category,
            confidence: o.confidence,
            locationName: o.location?.name || 'Tadoba Forest',
            lat,
            lng,
            date: o.observedAt,
            source: o.source || 'Live Observation',
            isGeojson: false,
          };

          return (
            <div key={o._id}>
              {isHovered && (
                <CircleMarker
                  center={[lat, lng]}
                  radius={18}
                  pathOptions={{ color: '#ff7a00', weight: 2, dashArray: '4 4', fillColor: '#ff9800', fillOpacity: 0.25 }}
                />
              )}
              <CircleMarker
                center={[lat, lng]}
                radius={isHovered ? 11 : 7}
                pathOptions={{
                  color: isHovered ? '#ffffff' : '#fff',
                  weight: isHovered ? 3 : 2,
                  fillColor: isHovered ? '#ff5722' : colorOf('observations'),
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  mouseover: () => onHoverAnimal?.(animalPayload),
                  mouseout: () => onHoverAnimal?.(null),
                  click: () => onSelectAnimal?.(animalPayload),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} permanent={Boolean(isHovered)} opacity={0.98}>
                  <div className="map-tooltip-box">
                    <div className="tooltip-head">
                      <span className="tooltip-badge obs-badge">🐾 {o.species}</span>
                      <span className="tooltip-confidence">{o.confidence}% conf</span>
                    </div>
                    <div className="tooltip-title">{o.location?.name || 'Observation Point'}</div>
                    <div className="tooltip-sub">
                      <span>📅 {formatDateTime(o.observedAt)}</span>
                      <span>📍 {lat.toFixed(4)}, {lng.toFixed(4)}</span>
                      <span>📷 {o.source || 'Live Sighting'}</span>
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="popup-box">
                    <h3 style={{ margin: '0 0 .3rem' }}>{o.species}</h3>
                    <p style={{ margin: '0 0 .3rem' }}><strong>Location:</strong> {o.location?.name}</p>
                    <p style={{ margin: '0 0 .3rem' }}><strong>Observed:</strong> {formatDateTime(o.observedAt)}</p>
                    <p style={{ margin: 0 }}><strong>Coordinates:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}

        {/* GeoJSON Tiger Dataset */}
        {visible.tigerGeojson && geojsonData?.features?.map((feature, idx) => {
          const coords = feature.geometry?.coordinates;
          if (!coords || coords.length < 2) return null;
          const [lng, lat] = coords;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;

          const prop = feature.properties || {};
          const featureId = prop.gbifID || prop.catalogNumber || `tiger-${idx}`;
          const isMatchingSearch = !filteredGeojsonIds || filteredGeojsonIds.has(featureId);

          // If a search query is active and this point is not matching, hide or dim
          if (!isMatchingSearch) return null;

          const isHovered = hoveredAnimal && (
            hoveredAnimal.id === featureId ||
            (Math.abs(hoveredAnimal.lat - lat) < 0.0001 && Math.abs(hoveredAnimal.lng - lng) < 0.0001)
          );

          const animalPayload = {
            id: featureId,
            species: prop.species || 'Panthera tigris',
            scientificName: prop.scientificName || prop.verbatimScientificName || 'Panthera tigris tigris',
            observer: prop.recordedBy || prop.identifiedBy || 'Wildlife Tracker',
            lat,
            lng,
            date: prop.eventDate || prop.dateIdentified,
            catalogNumber: prop.catalogNumber,
            occurrenceID: prop.occurrenceID,
            source: 'GeoJSON Dataset (GBIF / iNaturalist)',
            isGeojson: true,
          };

          return (
            <div key={featureId}>
              {isHovered && (
                <CircleMarker
                  center={[lat, lng]}
                  radius={20}
                  pathOptions={{
                    color: '#e65100',
                    weight: 2,
                    dashArray: '3 3',
                    fillColor: '#ff9800',
                    fillOpacity: 0.35,
                  }}
                />
              )}
              <CircleMarker
                center={[lat, lng]}
                radius={isHovered ? 12 : 6}
                pathOptions={{
                  color: isHovered ? '#ffffff' : '#fff',
                  weight: isHovered ? 3 : 1.5,
                  fillColor: isHovered ? '#d84315' : '#e65100',
                  fillOpacity: isHovered ? 1 : 0.85,
                }}
                eventHandlers={{
                  mouseover: () => onHoverAnimal?.(animalPayload),
                  mouseout: () => onHoverAnimal?.(null),
                  click: () => onSelectAnimal?.(animalPayload),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} permanent={Boolean(isHovered)} opacity={0.98}>
                  <div className="map-tooltip-box tiger-tooltip">
                    <div className="tooltip-head">
                      <span className="tooltip-badge tiger-badge">🐯 {prop.species || 'Tiger'}</span>
                      <span className="tooltip-tag">GeoJSON</span>
                    </div>
                    <div className="tooltip-title">{prop.scientificName || 'Panthera tigris'}</div>
                    <div className="tooltip-sub">
                      <span>👤 Observer: <strong>{prop.recordedBy || prop.identifiedBy || 'Field Tracker'}</strong></span>
                      <span>📅 Date: <strong>{prop.eventDate ? formatDateTime(prop.eventDate) : 'Recorded'}</strong></span>
                      <span>📍 GPS: <strong>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</strong></span>
                      {prop.catalogNumber && <span>🔖 Catalog #{prop.catalogNumber}</span>}
                    </div>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="popup-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.4rem' }}>
                      <span className="tooltip-badge tiger-badge">🐯 Tiger (GeoJSON)</span>
                    </div>
                    <h4 style={{ margin: '0 0 .3rem' }}>{prop.scientificName || 'Panthera tigris'}</h4>
                    <p style={{ margin: '0 0 .25rem', fontSize: '.88rem' }}><strong>Observer:</strong> {prop.recordedBy || prop.identifiedBy || 'N/A'}</p>
                    <p style={{ margin: '0 0 .25rem', fontSize: '.88rem' }}><strong>Date:</strong> {prop.eventDate ? formatDateTime(prop.eventDate) : 'N/A'}</p>
                    <p style={{ margin: '0 0 .35rem', fontSize: '.88rem' }}><strong>GPS:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}</p>
                    {prop.occurrenceID && (
                      <a href={prop.occurrenceID} target="_blank" rel="noopener noreferrer" className="small" style={{ color: '#17599f', textDecoration: 'underline' }}>
                        View iNaturalist Record ↗
                      </a>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}

        {/* Incidents */}
        {visible.incidents && data?.incidents?.map((i) => (
          <CircleMarker
            key={i._id}
            center={[i.location?.lat, i.location?.lng]}
            radius={8}
            pathOptions={{ color: '#fff', weight: 2, fillColor: colorOf('incidents'), fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <strong>{i.incidentId}: {i.title}</strong><br />
              {i.type} - {i.priority}<br />
              {formatDateTime(i.occurredAt)}
            </Tooltip>
            <Popup>
              <strong>{i.incidentId}: {i.title}</strong><br />
              {i.type} - {i.priority}<br />
              {formatDateTime(i.occurredAt)}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
