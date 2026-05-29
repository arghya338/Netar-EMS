import { useState } from 'react';
import { Dashboard } from '../dashboard/Dashboard';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const [activeNav, setActiveNav] = useState('Overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        activeNav={activeNav}
        collapsed={sidebarCollapsed}
        onSelect={setActiveNav}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <main className="main-shell">
        <TopBar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />
        <Dashboard />
      </main>
    </div>
  );
}
