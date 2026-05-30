import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { MUTATIONS_ENABLED, logoutSession, type AppSession } from '../../api/netarApi';

interface TopBarProps {
  activeNav: string;
  searchQuery: string;
  session: AppSession;
  sidebarCollapsed: boolean;
  onLogout: () => void;
  onSearchChange: (value: string) => void;
  onToggleSidebar: () => void;
}

export function TopBar({
  activeNav,
  searchQuery,
  session,
  sidebarCollapsed,
  onLogout,
  onSearchChange,
  onToggleSidebar,
}: TopBarProps) {
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const handleLogout = async () => {
    await logoutSession();
    onLogout();
  };

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <button
          className="sidebar-toggle"
          type="button"
          aria-label="Toggle sidebar navigation"
          aria-pressed={!sidebarCollapsed}
          onClick={onToggleSidebar}
        >
          <Menu size={19} />
        </button>
        <div className="top-brand-lockup" aria-label="Netar EMS">
          <img className="top-brand-logo" src="/assets/netar-light-logo.png" alt="Netar EMS" />
          <span>Netar EMS</span>
        </div>
        <div className="page-title">
          <h1>{activeNav}</h1>
        </div>
      </div>

      <div className="top-actions">
        <label className="search-box shell-search">
          <Search size={17} />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search NE, site, alarm, KPI..."
            aria-label="Search Netar EMS"
          />
        </label>
        <span className="live-system-chip">
          <i />
          Live System
        </span>
        <button className="top-icon alarm-button" type="button" aria-label="Alarms" aria-expanded={noticeOpen} onClick={() => setNoticeOpen((open) => !open)}>
          <Bell size={17} />
        </button>
        <button className="top-icon" type="button" aria-label="Help"><CircleHelp size={17} /></button>
        <button className="top-icon" type="button" aria-label="Settings"><Settings size={17} /></button>
        {noticeOpen && (
          <div className="top-popover notification-popover">
            <strong>System notice</strong>
            <span>{MUTATIONS_ENABLED ? 'Live-changing actions require operator confirmation.' : 'Live-changing actions are disabled by environment policy.'}</span>
          </div>
        )}
        <div className="top-divider" />
        <button className="admin-menu" type="button" aria-expanded={adminOpen} onClick={() => setAdminOpen((open) => !open)}>
          <span><UserRound size={15} /></span>
          <strong>{session.username}</strong>
          <ChevronDown size={16} />
        </button>
        {adminOpen && (
          <div className="top-popover admin-popover">
            <button type="button">Netar EMS profile</button>
            <button type="button">Audit trail</button>
            <button type="button" onClick={handleLogout}><LogOut size={13} /> Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}
