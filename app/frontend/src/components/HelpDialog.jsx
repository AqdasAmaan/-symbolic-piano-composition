import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function HelpDialog({ open, onClose }) {
  const dialogRef = useRef(null);

  // <dialog> gives us focus trapping, Escape-to-close and a backdrop.
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="help-dialog"
      aria-labelledby="help-title"
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop targets the <dialog> element itself.
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="help-content">
        <div className="help-header">
          <h2 id="help-title">How NOCTURNE works</h2>

          <button
            type="button"
            className="icon-button"
            aria-label="Close help"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <h3>Settings</h3>
        <dl>
          <dt>Generation length</dt>
          <dd>
            How many tokens the model generates. More tokens make a longer
            piece but take longer to generate.
          </dd>

          <dt>Temperature</dt>
          <dd>
            Low values stay predictable and conservative. High values take
            more risks and sound more experimental.
          </dd>

          <dt>Top-k and Top-p (Advanced)</dt>
          <dd>
            Limit which notes the model may pick next. Top-k keeps only the
            k most likely choices. Top-p keeps the smallest group of choices
            whose combined probability reaches p. Lower values sound more
            focused, higher values more varied.
          </dd>
        </dl>

        <h3>Keyboard shortcuts</h3>
        <dl className="shortcut-list">
          <dt><kbd>Space</kbd></dt>
          <dd>Play or pause</dd>

          <dt><kbd>←</kbd> <kbd>→</kbd></dt>
          <dd>Skip 5 seconds back or forward</dd>

          <dt><kbd>Home</kbd> <kbd>End</kbd></dt>
          <dd>Jump to the start or end (with the seek bar focused)</dd>
        </dl>

        <h3>Your composition</h3>
        <p>
          Download the MIDI file to open it in any music software. Starting
          a new composition discards the current one, so download it first
          if you want to keep it.
        </p>
      </div>
    </dialog>
  );
}