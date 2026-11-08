
import {
  Music2,
  Plus,
  Library,
  AudioLines,
  Settings,
  CircleHelp,
} from "lucide-react";

const navigation = [
  { label: "Composer", icon: AudioLines },
  { label: "My compositions", icon: Library },
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
};

export default function Sidebar({ modelStatus = { state: "checking" } }) {
  const status = statusLabels[modelStatus.state] || statusLabels.checking;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Music2 size={21} />
        </div>
        <span>NOCTURNE</span>
      </div>

      <button className="new-composition">
        <Plus size={17} />
        New composition
      </button>

      <div className="nav-section">
        <span className="nav-heading">WORKSPACE</span>

        {navigation.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${label === "Composer" ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        <button className="nav-item">
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <button className="nav-item">
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
