import { useState } from "react";
import { SlidersHorizontal, Sparkles, X } from "lucide-react";

const UNAVAILABLE_MESSAGES = {
  checking: "Checking the backend...",
  not_ready: "The model isn't loaded yet. Please wait a moment.",
  offline: "Can't reach the backend. Make sure the server is running.",
  misconfigured:
    "The API address isn't configured. Set VITE_API_BASE_URL in .env.",
};

export default function Composer({
  onGenerate,
  onCancel,
  isGenerating,
  modelStatus = { state: "checking" },
}) {
  const [tokens, setTokens] = useState(512);
  const [temperature, setTemperature] = useState(1.5);
  const [topK, setTopK] = useState(15);
  const [topP, setTopP] = useState(0.95);

  const isModelReady = modelStatus.state === "ready";

  const handleGenerate = () => {
    onGenerate({
      maxNewTokens: tokens,
      temperature,
      topK,
      topP,
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

      <details className="advanced-settings">
        <summary>Advanced</summary>

        <div className="setting-group">
          <div className="setting-label">
            <label htmlFor="top-k">Top-k</label>
            <span>{topK}</span>
          </div>

          <input
            id="top-k"
            type="range"
            min="1"
            max="100"
            step="1"
            value={topK}
            disabled={isGenerating}
            onChange={(e) => setTopK(Number(e.target.value))}
          />

          <div className="range-labels">
            <span>Focused</span>
            <span>Varied</span>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-label">
            <label htmlFor="top-p">Top-p</label>
            <span>{topP.toFixed(2)}</span>
          </div>

          <input
            id="top-p"
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={topP}
            disabled={isGenerating}
            onChange={(e) => setTopP(Number(e.target.value))}
          />

          <div className="range-labels">
            <span>Focused</span>
            <span>Varied</span>
          </div>
        </div>
      </details>

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