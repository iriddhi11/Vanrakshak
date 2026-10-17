import { LayoutDashboard, Map, PawPrint, Leaf, ShieldAlert, Footprints, Bell, FileText, Database, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/forest-map', label: 'Forest Map', icon: Map },
  { path: '/observations', label: 'Animal Observations', icon: PawPrint },
  { path: '/vegetation', label: 'Vegetation Analysis', icon: Leaf },
  { path: '/incidents', label: 'Incidents', icon: ShieldAlert },
  { path: '/patrols', label: 'Patrol Activity', icon: Footprints },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/data-models', label: 'Data & Models', icon: Database },
  { path: '/settings', label: 'Settings', icon: Settings },
];
