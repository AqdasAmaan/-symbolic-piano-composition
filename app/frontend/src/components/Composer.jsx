
import { useState } from "react";
import { SlidersHorizontal, Sparkles } from "lucide-react";

export default function Composer({ onGenerate, isGenerating }) {
  const [tokens, setTokens] = useState(2000);
  const [temperature, setTemperature] = useState(1.5);

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
        disabled={isGenerating}
      >
        <Sparkles size={17} />
        {isGenerating ? "Generating..." : "Generate composition"}
      </button>

      <p className="backend-note">
        {isGenerating
          ? "Your piano composition is being generated. Please wait..."
          : "Ready to generate your composition."}
      </p>
    </section>
  );
}
