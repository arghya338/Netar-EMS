import { useEffect, useState } from 'react';
import type { AppSession } from '../../api/netarApi';
import { OperationsRouter } from '../operations/OperationsConsole';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  session: AppSession;
  onSessionEnd: () => void;
}

export function AppShell({ session, onSessionEnd }: AppShellProps) {
  const [activeNav, setActiveNav] = useState('Overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [activeNav]);

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
          activeNav={activeNav}
          searchQuery={searchQuery}
          session={session}
          sidebarCollapsed={sidebarCollapsed}
          onLogout={onSessionEnd}
          onSearchChange={setSearchQuery}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />
        <OperationsRouter
          activeNav={activeNav}
          searchQuery={searchQuery}
          session={session}
          onNavigate={setActiveNav}
        />
      </main>
    </div>
  );
}
