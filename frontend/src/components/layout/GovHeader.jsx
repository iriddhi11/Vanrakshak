import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFontSize } from '../../hooks/useFontSize.js';

export function Emblem() {
  return (
    <svg className="emblem" viewBox="0 0 64 64" role="img" aria-label="Forest Department logo placeholder">
      <circle cx="32" cy="32" r="30" fill="#1f6b3c" />
      <path d="M32 11c11 8 15 19 9 30-3 5-9 8-9 13 0-5-6-8-9-13-6-11-2-22 9-30z" fill="#fff" />
      <circle cx="32" cy="30" r="4" fill="#1f6b3c" />
    </svg>
  );
}

export default function GovHeader({ onMenu }) {
  const { user, logout } = useAuth();
  const { change, reset } = useFontSize();

  return (
    <header>
      <div className="utility-bar">
        <div className="utility-inner">
          <a href="#main-content">Skip to main content</a>
          <div className="font-controls" aria-label="Text size">
            <button type="button" onClick={() => change(-1)} aria-label="Decrease text size">A-</button>
            <button type="button" onClick={reset} aria-label="Reset text size">A</button>
            <button type="button" onClick={() => change(1)} aria-label="Increase text size">A+</button>
          </div>
        </div>
      </div>
      <div className="gov-header">
        <div className="gov-header-inner">
          <button type="button" className="icon-btn menu-toggle" onClick={onMenu} aria-label="Open navigation"><Menu size={24} /></button>
          <Emblem />
          <div className="gov-titles">
            <div className="org">Forest Department, Government of Maharashtra</div>
            <div className="title">Tadoba Andhari Tiger Reserve - Monitoring Portal</div>
          </div>
          <div className="spacer" />
          <div className="user-chip">
            <strong>{user?.name}</strong>
            <span className="muted">{user?.designation || user?.role}</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}><LogOut size={16} /> Sign out</button>
        </div>
      </div>
      <div className="tricolor" />
    </header>
  );
}
