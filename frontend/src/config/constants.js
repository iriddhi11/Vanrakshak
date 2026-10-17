// Keep in sync with backend/src/config/constants.js
export const ZONES = ['Core Zone', 'Buffer Zone', 'Periphery'];
export const SPECIES_CATEGORIES = ['Tiger', 'Leopard', 'Wild Boar', 'Deer', 'Others'];
export const OBSERVATION_SOURCES = ['Camera Trap', 'Patrol', 'Manual Entry'];
export const INCIDENT_TYPES = ['Poaching', 'Snare', 'Fire', 'Human Intrusion', 'Vehicle Activity', 'Others'];
export const INCIDENT_STATUS = ['Pending', 'Under Review', 'Verified', 'Closed'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const ALERT_STATUS = ['Open', 'Reviewed', 'Dismissed', 'Escalated'];
export const PATROL_STATUS = ['Planned', 'In Progress', 'Completed'];
export const HEALTH_STATUS = ['Healthy', 'Moderate', 'Stressed'];
export const REPORT_TYPES = ['Monthly Summary', 'Incident Report', 'Wildlife Observation Report', 'Patrol Coverage Report'];
export const DATA_STATUS = ['Active', 'Processing', 'Archived'];
export const MODEL_STATUS = ['Active', 'Testing', 'Retired'];
export const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'forest_officer', label: 'Forest Officer' },
  { value: 'ranger', label: 'Ranger' },
  { value: 'analyst', label: 'Analyst' },
];

export const WRITE_ROLES = ['admin', 'forest_officer', 'ranger'];
export const DELETE_ROLES = ['admin', 'forest_officer'];
export const DATA_ROLES = ['admin', 'analyst'];

export const opts = (list) => list.map((v) => ({ value: v, label: v }));
