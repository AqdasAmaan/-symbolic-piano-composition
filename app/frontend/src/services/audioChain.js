// Loudness handling for the piano player.
//
// Signal path:   notes -> volume gain (can amplify) -> limiter -> soft clipper -> speakers
//
// Why this exists: generated pieces often use fairly low MIDI velocities,
// and a plain 0-1 volume slider can only make things quieter. We (1) raise
// each piece so its loudest note reaches full level, (2) let the master
// volume amplify, and (3) catch peaks with a limiter so the extra level
// does not turn into harsh clipping, and (4) round off any peak the limiter
// lets through, so nothing ever reaches the speakers above full scale.

// Maximum amplification at the top of the volume slider (4 = about +12 dB).
export const MASTER_BOOST = 4;

// Slider position (0-1) -> linear gain. Squared, so the lower half of the
// slider gives finer control, as on most volume controls.
export function volumeToGain(volume) {
  const clamped = Math.min(Math.max(volume, 0), 1);

  return MASTER_BOOST * clamped * clamped;
}

// Soft-saturation curve for the WaveShaper (domain -1..1, output -1..1).
// The input is scaled by SHAPER_HEADROOM first, so signals up to
// 1 / SHAPER_HEADROOM (here 2x full scale) are rounded off smoothly instead
// of being hard-clipped. Small signals pass at roughly unity gain.
const SHAPER_HEADROOM = 0.5;
const SHAPER_DRIVE = 2;

export function createSoftClipCurve(samples = 1024) {
  const curve = new Float32Array(samples);
  const norm = Math.tanh(SHAPER_DRIVE);

  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1;

    curve[i] = Math.tanh(SHAPER_DRIVE * x) / norm;
  }

  return curve;
}

export function createMasterChain(audioContext, volume) {
  const gainNode = audioContext.createGain();
  gainNode.gain.value = volumeToGain(volume);

  // A fast, high-ratio compressor acts as a limiter: it leaves normal
  // playing alone and clamps loud chords instead of letting them clip.
  const limiter = audioContext.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 6;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;

  // Safety net: the limiter reacts a few milliseconds late, so a sudden
  // loud chord can briefly exceed full scale. Round those peaks off.
  const headroom = audioContext.createGain();
  headroom.gain.value = SHAPER_HEADROOM;

  const softClipper = audioContext.createWaveShaper();
  softClipper.curve = createSoftClipCurve();
  softClipper.oversample = "2x";

  gainNode.connect(limiter);
  limiter.connect(headroom);
  headroom.connect(softClipper);
  softClipper.connect(audioContext.destination);

  // Instruments should connect to `input`.
  return { input: gainNode, gainNode, limiter, softClipper };
}

// --- Per-note level --------------------------------------------------------

// Quietest allowed note, so very soft notes stay audible.
export const MIN_NOTE_GAIN = 0.15;

// Never raise a piece by more than this, in case its velocities are
// degenerate (e.g. all nearly zero).
const MAX_VELOCITY_SCALE = 4;

// Factor that brings the loudest note of a piece up to full level while
// keeping the relative dynamics between notes.
export function getVelocityScale(notes) {
  let peak = 0;

  for (const note of notes) {
    if (note.velocity > peak) peak = note.velocity;
  }

  return peak > 0 ? Math.min(1 / peak, MAX_VELOCITY_SCALE) : 1;
}

export function noteGain(velocity, scale) {
  return Math.min(1, Math.max(MIN_NOTE_GAIN, velocity * scale));
}