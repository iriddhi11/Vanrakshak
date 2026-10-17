export const LAYER_DEFS = [
  { key: 'reserve', label: 'Reserve Boundary', color: '#17365d' },
  { key: 'core', label: 'Core Zone', color: '#1f6b3c' },
  { key: 'buffer', label: 'Buffer Zone', color: '#8a9a2b' },
  { key: 'patrols', label: 'Patrol Routes', color: '#e8821a' },
  { key: 'camera_node', label: 'Camera Nodes', color: '#17599f' },
  { key: 'observations', label: 'Animal Sightings (Live)', color: '#1d7a3f' },
  { key: 'tigerGeojson', label: 'Tiger GeoJSON Dataset (839)', color: '#e65100' },
  { key: 'incidents', label: 'Incidents', color: '#b3261e' },
  { key: 'gate', label: 'Forest Gates', color: '#6b3fa0' },
  { key: 'village', label: 'Villages', color: '#8c5a2b' },
  { key: 'water_body', label: 'Water Bodies', color: '#1a8fb3' },
];

export const defaultVisibility = () => Object.fromEntries(LAYER_DEFS.map((l) => [l.key, true]));
export const colorOf = (key) => LAYER_DEFS.find((l) => l.key === key)?.color || '#555';
