
import { ChevronDown, CircleHelp } from "lucide-react";

export default function Header() {
  return (
    <header className="header">
      <div className="breadcrumb">
        Workspace <span>/</span> <strong>Composer</strong>
      </div>

      <div className="header-actions">
        <button className="icon-button" aria-label="Help">
          <CircleHelp size={18} />
        </button>

        <div className="profile">
          <div className="avatar">N</div>
          <span>Composer</span>
          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  );
}
