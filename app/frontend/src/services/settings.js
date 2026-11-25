// Generation settings: presets, human-friendly labels and persistence.
// Everything user-facing about the model parameters is defined here so
// the labels are easy to retune in one place.

// "Length" presets map to the number of tokens the model generates.
// Backend limit: 32-2000.
export const LENGTH_PRESETS = [
  {
    id: "short",
    label: "Short",
    tokens: 256,
    description: "A brief musical sketch. Quickest to generate.",
  },
  {
    id: "medium",
    label: "Medium",
    tokens: 512,
    description: "A short piece. A good place to start.",
  },
  {
    id: "long",
    label: "Long",
    tokens: 1024,
    description: "A fuller piece. Takes noticeably longer to generate.",
  },
  {
    id: "extended",
    label: "Extended",
    tokens: 2000,
    description: "The longest the model allows. Takes the longest.",
  },
];

// "Creativity" is the model's temperature.
export const TEMPERATURE_RANGE = { min: 0.5, max: 3.0, step: 0.05 };

// Words shown next to the slider. Each band applies up to and
// including `upTo`.
const TEMPERATURE_BANDS = [
  { upTo: 1.0, label: "Calm" },
  { upTo: 1.75, label: "Balanced" },
  { upTo: 2.5, label: "Adventurous" },
  { upTo: Infinity, label: "Wild" },
];

export function describeTemperature(temperature) {
  return TEMPERATURE_BANDS.find((band) => temperature <= band.upTo).label;
}

export const TOP_K_RANGE = { min: 1, max: 100, step: 1 };
export const TOP_P_RANGE = { min: 0.1, max: 1, step: 0.01 };

export const DEFAULT_SETTINGS = {
  lengthId: "medium",
  temperature: 1.5,
  topK: 15,
  topP: 0.95,
};

export function getLengthPreset(lengthId) {
  return (
    LENGTH_PRESETS.find((preset) => preset.id === lengthId) ||
    LENGTH_PRESETS.find((preset) => preset.id === DEFAULT_SETTINGS.lengthId)
  );
}

export function areSettingsDefault(settings) {
  return Object.keys(DEFAULT_SETTINGS).every(
    (key) => settings[key] === DEFAULT_SETTINGS[key]
  );
}

export function areAdvancedSettingsDefault(settings) {
  return (
    settings.topK === DEFAULT_SETTINGS.topK &&
    settings.topP === DEFAULT_SETTINGS.topP
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function numberOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

// Accepts anything (e.g. whatever is in localStorage) and returns a
// complete, valid settings object.
export function sanitizeSettings(raw) {
  const input = raw && typeof raw === "object" ? raw : {};

  return {
    lengthId: LENGTH_PRESETS.some((preset) => preset.id === input.lengthId)
      ? input.lengthId
      : DEFAULT_SETTINGS.lengthId,
    temperature: clamp(
      numberOr(input.temperature, DEFAULT_SETTINGS.temperature),
      TEMPERATURE_RANGE.min,
      TEMPERATURE_RANGE.max
    ),
    topK: Math.round(
      clamp(
        numberOr(input.topK, DEFAULT_SETTINGS.topK),
        TOP_K_RANGE.min,
        TOP_K_RANGE.max
      )
    ),
    topP: clamp(
      numberOr(input.topP, DEFAULT_SETTINGS.topP),
      TOP_P_RANGE.min,
      TOP_P_RANGE.max
    ),
  };
}

const STORAGE_KEY = "nocturne.settings.v1";

export function loadSettings() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    return stored
      ? sanitizeSettings(JSON.parse(stored))
      : { ...DEFAULT_SETTINGS };
  } catch {
    // Storage unavailable (private mode) or corrupted JSON.
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Not critical: settings just won't persist.
  }
}