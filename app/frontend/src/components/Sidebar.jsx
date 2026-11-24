import {
  Music2,
  Plus,
  Library,
  AudioLines,
  CircleHelp,
} from "lucide-react";

const navigation = [
  { label: "Composer", icon: AudioLines, active: true },
  { label: "My compositions", icon: Library, comingSoon: true },
];

const statusLabels = {
  checking: {
    title: "Checking status",
    description: "Contacting backend...",
  },
  ready: {
    title: "Model ready",
    description: "Ready to generate",
  },
  not_ready: {
    title: "Model unavailable",
    description: "Backend online · Model not loaded",
  },
  offline: {
    title: "Backend offline",
    description: "Cannot reach the API",
  },
  misconfigured: {
    title: "Not configured",
    description: "Set VITE_API_BASE_URL",
  },
};

export default function Sidebar({
  modelStatus = { state: "checking" },
  onNewComposition,
  onHelp,
}) {
  const status = statusLabels[modelStatus.state] || statusLabels.checking;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Music2 size={21} />
        </div>
        <span>NOCTURNE</span>
      </div>

      <button
        type="button"
        className="new-composition"
        onClick={onNewComposition}
      >
        <Plus size={17} />
        New composition
      </button>

      <div className="nav-section">
        <span className="nav-heading">WORKSPACE</span>

        {navigation.map(({ label, icon: Icon, active, comingSoon }) => (
          <button
            key={label}
            type="button"
            className={`nav-item ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
            disabled={comingSoon}
          >
            <Icon size={18} />
            <span>{label}</span>
            {comingSoon && <span className="nav-badge">Soon</span>}
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        <button type="button" className="nav-item" onClick={onHelp}>
          <CircleHelp size={18} />
          <span>Help</span>
        </button>

        <div className="model-status">
          <span className={`status-dot ${modelStatus.state}`} />

          <div>
            <strong>{status.title}</strong>
            <small>{status.description}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}