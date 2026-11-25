import { useEffect, useState } from "react";
import { SlidersHorizontal, Sparkles, X } from "lucide-react";

import {
  LENGTH_PRESETS,
  TEMPERATURE_RANGE,
  TOP_K_RANGE,
  TOP_P_RANGE,
  DEFAULT_SETTINGS,
  areAdvancedSettingsDefault,
  areSettingsDefault,
  describeTemperature,
  getLengthPreset,
  loadSettings,
  saveSettings,
} from "../services/settings";

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
  const [settings, setSettings] = useState(loadSettings);

  // Open "Advanced" on first render only if it holds non-default values.
  const [advancedOpen] = useState(
    () => !areAdvancedSettingsDefault(loadSettings())
  );

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = (patch) => setSettings((current) => ({ ...current, ...patch }));

  const isModelReady = modelStatus.state === "ready";
  const lengthPreset = getLengthPreset(settings.lengthId);

  const handleGenerate = () => {
    onGenerate({
      maxNewTokens: lengthPreset.tokens,
      temperature: settings.temperature,
      topK: settings.topK,
      topP: settings.topP,
    });
  };

  return (
    <section className="composer-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CREATE</span>
          <h2>Composition settings</h2>
          <p>Choose how long and how adventurous your piece should be.</p>
        </div>
        <SlidersHorizontal size={20} />
      </div>

      <div className="setting-group">
        <div className="setting-label">
          <span id="length-label" className="setting-title">
            Length
          </span>
          <span>{lengthPreset.tokens} tokens</span>
        </div>

        <div
          className="segmented"
          role="radiogroup"
          aria-labelledby="length-label"
        >
          {LENGTH_PRESETS.map((preset) => (
            <label key={preset.id} className="segment">
              <input
                type="radio"
                name="length"
                value={preset.id}
                checked={settings.lengthId === preset.id}
                disabled={isGenerating}
                onChange={() => update({ lengthId: preset.id })}
              />
              <span className="segment-body">
                <strong>{preset.label}</strong>
                <small>{preset.tokens}</small>
              </span>
            </label>
          ))}
        </div>

        <p className="setting-help">{lengthPreset.description}</p>
      </div>

      <div className="setting-group">
        <div className="setting-label">
          <label htmlFor="temperature">Creativity</label>
          <span>
            {describeTemperature(settings.temperature)} ·{" "}
            {settings.temperature.toFixed(2)}
          </span>
        </div>

        <input
          id="temperature"
          type="range"
          min={TEMPERATURE_RANGE.min}
          max={TEMPERATURE_RANGE.max}
          step={TEMPERATURE_RANGE.step}
          value={settings.temperature}
          disabled={isGenerating}
          onChange={(e) => update({ temperature: Number(e.target.value) })}
        />

        <div className="range-labels">
          <span>Predictable</span>
          <span>Surprising</span>
        </div>

        <p className="setting-help">
          Also called temperature. Lower values stay safe and familiar,
          higher values take more risks.
        </p>
      </div>

      <details className="advanced-settings" open={advancedOpen || undefined}>
        <summary>Advanced</summary>

        <div className="setting-group">
          <div className="setting-label">
            <label htmlFor="top-k">Choice pool (top-k)</label>
            <span>{settings.topK}</span>
          </div>

          <input
            id="top-k"
            type="range"
            min={TOP_K_RANGE.min}
            max={TOP_K_RANGE.max}
            step={TOP_K_RANGE.step}
            value={settings.topK}
            disabled={isGenerating}
            onChange={(e) => update({ topK: Number(e.target.value) })}
          />

          <div className="range-labels">
            <span>Focused</span>
            <span>Varied</span>
          </div>

          <p className="setting-help">
            At each step the model picks from its {settings.topK} most
            likely options.
          </p>
        </div>

        <div className="setting-group">
          <div className="setting-label">
            <label htmlFor="top-p">Probability cutoff (top-p)</label>
            <span>{settings.topP.toFixed(2)}</span>
          </div>

          <input
            id="top-p"
            type="range"
            min={TOP_P_RANGE.min}
            max={TOP_P_RANGE.max}
            step={TOP_P_RANGE.step}
            value={settings.topP}
            disabled={isGenerating}
            onChange={(e) => update({ topP: Number(e.target.value) })}
          />

          <div className="range-labels">
            <span>Focused</span>
            <span>Varied</span>
          </div>

          <p className="setting-help">
            Unlikely options are ignored once the likely ones add up to{" "}
            {Math.round(settings.topP * 100)}%.
          </p>
        </div>
      </details>

      {!areSettingsDefault(settings) && (
        <button
          type="button"
          className="reset-button"
          disabled={isGenerating}
          onClick={() => setSettings({ ...DEFAULT_SETTINGS })}
        >
          Reset to defaults
        </button>
      )}

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