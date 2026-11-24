import { CircleHelp } from "lucide-react";

export default function Header({ onHelp }) {
  return (
    <header className="header">
      <div className="breadcrumb">
        Workspace <span>/</span> <strong>Composer</strong>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          aria-label="Help"
          title="Help"
          onClick={onHelp}
        >
          <CircleHelp size={18} />
        </button>
      </div>
    </header>
  );
}