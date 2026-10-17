import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import GovHeader from './GovHeader.jsx';
import Sidebar from './Sidebar.jsx';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <GovHeader onMenu={() => setMenuOpen((o) => !o)} />
      <div className="shell">
        <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        <main id="main-content" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <footer className="gov-footer">
        Tadoba Andhari Tiger Reserve Monitoring Portal - Prototype build for departmental evaluation. Displayed records are sample data.
      </footer>
    </>
  );
}
