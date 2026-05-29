import { Bell, ChevronDown, Menu, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function TopBar({ sidebarCollapsed, onToggleSidebar }: TopBarProps) {
  const [query, setQuery] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

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
        <div className="page-title">
          <h1>5G Core Network</h1>
          <ChevronDown size={15} />
        </div>
      </div>

      <div className="top-actions">
        <label className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search anything..."
            aria-label="Search anything"
          />
        </label>
        <button className="top-icon has-badge" type="button" aria-label="Notifications" aria-expanded={noticeOpen} onClick={() => setNoticeOpen((open) => !open)}>
          <Bell size={18} />
        </button>
        {noticeOpen && (
          <div className="top-popover notification-popover">
            <strong>5 active alerts</strong>
            <span>AMF CPU and UPF packet loss require review.</span>
          </div>
        )}
        <button className="top-icon" type="button" aria-label="Automation">
          <Sparkles size={17} />
        </button>
        <div className="top-divider" />
        <button className="admin-menu" type="button" aria-expanded={adminOpen} onClick={() => setAdminOpen((open) => !open)}>
          <span />
          <strong>admin</strong>
          <ChevronDown size={16} />
        </button>
        {adminOpen && (
          <div className="top-popover admin-popover">
            <button type="button">Profile</button>
            <button type="button">Audit Trail</button>
            <button type="button">Sign Out</button>
          </div>
        )}
      </div>
    </header>
  );
}
