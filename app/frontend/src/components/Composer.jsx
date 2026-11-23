import { useState } from "react";
import { SlidersHorizontal, Sparkles, X } from "lucide-react";

const UNAVAILABLE_MESSAGES = {
  checking: "Checking the backend...",
  not_ready: "The model isn't loaded yet. Please wait a moment.",
  offline: "Can't reach the backend. Make sure the server is running.",
};

export default function Composer({
  onGenerate,
  onCancel,
  isGenerating,
  modelStatus = { state: "checking" },
}) {
  const [tokens, setTokens] = useState(512);
  const [temperature, setTemperature] = useState(1.5);

  const isModelReady = modelStatus.state === "ready";

  const handleGenerate = () => {
    onGenerate({
      maxNewTokens: tokens,
      temperature,
    });
  };

  return (
    <section className="composer-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CREATE</span>
          <h2>Composition settings</h2>
          <p>Configure your piano generation parameters.</p>
        </div>
        <SlidersHorizontal size={20} />
      </div>

      <div className="setting-group">
        <div className="setting-label">
          <label htmlFor="tokens">Generation length</label>
          <span>{tokens} tokens</span>
        </div>

        <input
          id="tokens"
          type="range"
          min="256"
          max="2000"
          step="16"
          value={tokens}
          disabled={isGenerating}
          onChange={(e) => setTokens(Number(e.target.value))}
        />

        <div className="range-labels">
          <span>256</span>
          <span>2000</span>
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label">
          <label htmlFor="temperature">Temperature</label>
          <span>{temperature.toFixed(2)}</span>
        </div>

        <input
          id="temperature"
          type="range"
          min="0.5"
          max="3.0"
          step="0.05"
          value={temperature}
          disabled={isGenerating}
          onChange={(e) => setTemperature(Number(e.target.value))}
        />

        <div className="range-labels">
          <span>Conservative</span>
          <span>Experimental</span>
        </div>
      </div>

      <div className="generation-note">
        <Sparkles size={17} />
        <p>
          Your composition will be generated using the fine-tuned
          piano Transformer model.
        </p>
      </div>

      <button
        className="generate-button"
        onClick={handleGenerate}
        disabled={isGenerating || !isModelReady}
      >
        <Sparkles size={17} />
        {isGenerating ? "Generating..." : "Generate composition"}
      </button>

      {isGenerating && (
        <button
          type="button"
          className="cancel-button"
          onClick={onCancel}
        >
          <X size={16} />
          Cancel
        </button>
      )}

      <p className="backend-note">
        {isGenerating
          ? "Your piano composition is being generated. Please wait..."
          : isModelReady
            ? "Ready to generate your composition."
            : UNAVAILABLE_MESSAGES[modelStatus.state] ||
              UNAVAILABLE_MESSAGES.checking}
      </p>
    </section>
  );
}