import { useState, useMemo } from 'react';
import { Search, X, Crosshair, MapPin, Eye, Filter } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import { AsyncView } from '../components/common/StateViews.jsx';
import ForestMap from '../components/map/ForestMap.jsx';
import { LAYER_DEFS, defaultVisibility } from '../components/map/layers.js';
import useFetch from '../hooks/useFetch.js';
import { dashboardApi } from '../api/resources.js';
import { formatDateTime } from '../utils/format.js';

const RANGES = [
  { v: 7, l: 'Last 7 days' },
  { v: 30, l: 'Last 30 days' },
  { v: 90, l: 'Last 90 days' },
  { v: 365, l: 'Last 1 year' },
];

export default function ForestMapPage() {
  const [days, setDays] = useState(30);
  const [visible, setVisible] = useState(defaultVisibility);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'tiger' | 'live'
  const [hoveredAnimal, setHoveredAnimal] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // Fetch regular map layers from MongoDB
  const layers = useFetch(() => dashboardApi.mapLayers({ days }), [days]);

  // Fetch GeoJSON tiger dataset (from backend API or static fallback)
  const geojsonState = useFetch(async () => {
    try {
      const data = await dashboardApi.tigerGeoJson();
      if (data && data.features) return data;
      throw new Error('Invalid GeoJSON');
    } catch {
      const res = await fetch('/data/tadoba_tiger_observations.geojson');
      if (!res.ok) throw new Error('Failed to load GeoJSON dataset');
      return await res.json();
    }
  }, []);

  const toggle = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  // GeoJSON features and live observations
  const geojsonFeatures = geojsonState.data?.features || [];
  const liveObs = layers.data?.observations || [];

  const searchLower = search.trim().toLowerCase();

  // Unified list of searchable animal items
  const allAnimals = useMemo(() => {
    const list = [];

    // Add Live observations from MongoDB
    if (filterType === 'all' || filterType === 'live') {
      liveObs.forEach((o) => {
        if (typeof o.location?.lat !== 'number' || typeof o.location?.lng !== 'number') return;
        const item = {
          id: o._id,
          species: o.species,
          scientificName: o.species,
          category: o.category,
          observer: o.createdBy?.name || o.source || 'Live Sighting',
          lat: o.location.lat,
          lng: o.location.lng,
          date: o.observedAt,
          locationName: o.location?.name || 'Tadoba Forest',
          isGeojson: false,
          confidence: o.confidence,
          icon: o.species.toLowerCase().includes('tiger') ? '🐯' : o.species.toLowerCase().includes('leopard') ? '🐆' : '🦌',
        };

        if (!searchLower) {
          list.push(item);
        } else if (
          item.species.toLowerCase().includes(searchLower) ||
          item.observer.toLowerCase().includes(searchLower) ||
          item.locationName.toLowerCase().includes(searchLower)
        ) {
          list.push(item);
        }
      });
    }

    // Add GeoJSON tiger dataset
    if (filterType === 'all' || filterType === 'tiger') {
      geojsonFeatures.forEach((f, idx) => {
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) return;
        const [lng, lat] = coords;
        const p = f.properties || {};
        const id = p.gbifID || p.catalogNumber || `tiger-${idx}`;
        const observer = p.recordedBy || p.identifiedBy || 'Wildlife Observer';
        const scientificName = p.scientificName || 'Panthera tigris';

        const item = {
          id,
          species: 'Tiger',
          scientificName,
          category: 'Tiger',
          observer,
          lat,
          lng,
          date: p.eventDate || p.dateIdentified,
          locationName: 'Tadoba Andhari Reserve',
          catalogNumber: p.catalogNumber,
          occurrenceID: p.occurrenceID,
          isGeojson: true,
          icon: '🐯',
        };

        if (!searchLower) {
          list.push(item);
        } else if (
          'tiger'.includes(searchLower) ||
          scientificName.toLowerCase().includes(searchLower) ||
          observer.toLowerCase().includes(searchLower) ||
          (p.eventDate && p.eventDate.includes(searchLower)) ||
          (p.catalogNumber && String(p.catalogNumber).includes(searchLower))
        ) {
          list.push(item);
        }
      });
    }

    return list;
  }, [liveObs, geojsonFeatures, filterType, searchLower]);

  // Set of IDs matching current search (used by ForestMap to filter GeoJSON rendering)
  const filteredGeojsonIds = useMemo(() => {
    if (!searchLower && filterType === 'all') return null;
    const ids = new Set();
    allAnimals.forEach((a) => {
      if (a.isGeojson) ids.add(a.id);
    });
    return ids;
  }, [allAnimals, searchLower, filterType]);

  // Display top search results in the search drawer (limit for fast rendering)
  const displayedResults = useMemo(() => {
    return allAnimals.slice(0, 30);
  }, [allAnimals]);

  return (
    <>
      <PageHeader
        title="Forest Map"
        subtitle="Interactive GIS Map with GeoJSON Animal Sightings, Zones, Camera Nodes, and Patrol Routes"
      />

      {/* Animal Search Bar */}
      <div className="map-search-bar">
        <div className="map-search-input-wrap">
          <Search size={18} className="map-search-icon" />
          <input
            type="search"
            className="map-search-input"
            aria-label="Search animal sightings"
            placeholder="Search animal (e.g. Tiger, Panthera tigris, observer name, year)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="map-search-clear"
              aria-label="Clear search"
              onClick={() => setSearch('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div className="search-pill-tabs">
          <button
            type="button"
            className={`search-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Animals ({geojsonFeatures.length + liveObs.length})
          </button>
          <button
            type="button"
            className={`search-pill ${filterType === 'tiger' ? 'active' : ''}`}
            onClick={() => setFilterType('tiger')}
          >
            🐯 GeoJSON Tigers ({geojsonFeatures.length})
          </button>
          <button
            type="button"
            className={`search-pill ${filterType === 'live' ? 'active' : ''}`}
            onClick={() => setFilterType('live')}
          >
            🐾 Live Sightings ({liveObs.length})
          </button>
        </div>
      </div>

      {/* Active Hover Notification Banner */}
      {hoveredAnimal && (
        <div className="hover-animal-banner">
          <div className="hover-animal-banner-left">
            <span className="hover-animal-banner-pulse" />
            <span>
              <strong>Hovered Animal:</strong> {hoveredAnimal.icon || '🐾'} {hoveredAnimal.species} (
              <em>{hoveredAnimal.scientificName || hoveredAnimal.species}</em>)
            </span>
            <span className="muted">|</span>
            <span>📍 {hoveredAnimal.lat.toFixed(4)}°N, {hoveredAnimal.lng.toFixed(4)}°E</span>
            <span className="muted">|</span>
            <span>👤 Observer: {hoveredAnimal.observer || 'Wildlife Dept'}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
            onClick={() => setSelectedAnimal(hoveredAnimal)}
          >
            <Crosshair size={14} style={{ marginRight: '0.3rem' }} /> Lock Target
          </button>
        </div>
      )}

      {/* Searched Animal Results Quick-List (shown when user searches or clicks filter) */}
      {search.trim().length > 0 && (
        <div className="animal-results-box">
          <div style={{ padding: '0.4rem 0.8rem', background: '#f8fafc', fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Search Results ({allAnimals.length} matches found — hover any card to inspect location on map)</span>
            {allAnimals.length > 30 && <span>Showing first 30</span>}
          </div>
          {displayedResults.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
              No animal sightings found matching &ldquo;{search}&rdquo;. Try searching &ldquo;Tiger&rdquo; or clearing the search.
            </div>
          ) : (
            displayedResults.map((animal) => {
              const isItemHovered = hoveredAnimal?.id === animal.id;
              return (
                <div
                  key={animal.id}
                  className={`animal-result-card ${isItemHovered ? 'is-hovered' : ''}`}
                  onMouseEnter={() => setHoveredAnimal(animal)}
                  onMouseLeave={() => setHoveredAnimal(null)}
                  onClick={() => {
                    setHoveredAnimal(animal);
                    setSelectedAnimal(animal);
                  }}
                >
                  <div className="animal-result-main">
                    <div className="animal-result-avatar">{animal.icon || '🐾'}</div>
                    <div className="animal-result-info">
                      <h4>
                        {animal.species} &mdash; <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{animal.scientificName}</span>
                      </h4>
                      <p>
                        👤 Observer: <strong>{animal.observer}</strong> &bull; 📅 {animal.date ? formatDateTime(animal.date) : 'N/A'}
                        {animal.catalogNumber && <span> &bull; Catalog #{animal.catalogNumber}</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="animal-result-coords">
                      {animal.lat.toFixed(4)}, {animal.lng.toFixed(4)}
                    </span>
                    <span className={`tooltip-badge ${animal.isGeojson ? 'tiger-badge' : 'obs-badge'}`}>
                      {animal.isGeojson ? 'GeoJSON' : 'Live'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Main Map + Side Controls Grid */}
      <div className="grid grid-side">
        <section className="card card-flush">
          <AsyncView state={layers}>
            <ForestMap
              data={layers.data}
              geojsonData={geojsonState.data}
              visible={visible}
              height={580}
              hoveredAnimal={hoveredAnimal}
              onHoverAnimal={setHoveredAnimal}
              selectedAnimal={selectedAnimal}
              onSelectAnimal={setSelectedAnimal}
              filteredGeojsonIds={filteredGeojsonIds}
            />
          </AsyncView>
        </section>

        <div className="grid" style={{ alignContent: 'start' }}>
          {/* Map Layers Checklist */}
          <section className="card">
            <div className="card-head">
              <h2>Map layers</h2>
            </div>
            <div className="layer-panel">
              {LAYER_DEFS.map((l) => (
                <label key={l.key} className="layer-row">
                  <span>
                    <span className="dot" style={{ background: l.color }} />
                    {l.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(visible[l.key])}
                    onChange={() => toggle(l.key)}
                  />
                </label>
              ))}
            </div>
          </section>

          {/* GeoJSON Dataset Information Card */}
          <section className="card">
            <div className="card-head">
              <h2>Tiger GeoJSON Dataset</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="tooltip-badge tiger-badge">839 Records</span>
                <span className="small muted">GBIF / iNaturalist</span>
              </div>
              <p className="small muted" style={{ lineHeight: 1.5 }}>
                Official geo-tagged observation points of <em>Panthera tigris</em> across Tadoba Andhari Tiger Reserve with observer names, observation dates, and GPS coordinates.
              </p>
              <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setFilterType('tiger');
                    setSearch('Tiger');
                    if (geojsonFeatures.length > 0) {
                      const sample = geojsonFeatures[0];
                      const [lng, lat] = sample.geometry.coordinates;
                      setHoveredAnimal({
                        id: sample.properties.gbifID,
                        species: 'Tiger',
                        scientificName: sample.properties.scientificName,
                        lat,
                        lng,
                        observer: sample.properties.recordedBy,
                      });
                    }
                  }}
                >
                  <Eye size={14} style={{ marginRight: '0.3rem' }} /> Explore Tigers on Map
                </button>
              </div>
            </div>
          </section>

          {/* Time Filter */}
          <section className="card">
            <div className="card-head">
              <h2>Time filter</h2>
            </div>
            <div className="card-body">
              <label className="sr-only" htmlFor="range">Time range</label>
              <select
                id="range"
                className="select"
                style={{ width: '100%' }}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                {RANGES.map((r) => (
                  <option key={r.v} value={r.v}>{r.l}</option>
                ))}
              </select>
              <p className="small muted" style={{ marginTop: '.6rem' }}>
                Zone boundaries (Core, Buffer, Reserve) are highlighted according to Tadoba forestry GIS records.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
