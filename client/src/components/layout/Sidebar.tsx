import { SidebarNav } from './SidebarNav';

interface SidebarProps {
  activeNav: string;
  collapsed: boolean;
  onSelect: (label: string) => void;
  onToggle: () => void;
}

export function Sidebar({ activeNav, collapsed, onSelect, onToggle }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <img className="brand-logo" src="/assets/netar-light-logo.png" alt="Netar EMS" />
        <span className="brand-name">EMS</span>
      </div>

      <SidebarNav activeNav={activeNav} onSelect={onSelect} />

      <div className="sidebar-bottom">
        <button className="collapse-control" type="button" aria-pressed={collapsed} onClick={onToggle}>
          <span>≡</span>
          Collapse
        </button>
      </div>
    </aside>
  );
}
