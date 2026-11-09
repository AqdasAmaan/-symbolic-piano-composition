
import { useCallback, useEffect, useRef, useState } from "react";
import { Midi } from "@tonejs/midi";
import Soundfont from "soundfont-player";
import {
  Download,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";

// import "./OutputPanel.css";

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function OutputPanel({
  midiUrl,
  error,
  isGenerating,
}) {
  const [midiData, setMidiData] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState("");

  const audioContextRef = useRef(null);
  const instrumentRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourcesRef = useRef([]);
  const timerRef = useRef(null);
  const positionRef = useRef(0);
  const startedAtRef = useRef(0);
  const midiRef = useRef(null);
  const seekWasPlayingRef = useRef(false);

  // Stop all currently scheduled or playing notes.
  const stopNotes = useCallback(() => {
    sourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // The source may have already stopped.
      }
    });

    sourcesRef.current = [];
  }, []);

  const stopPlayback = useCallback(() => {
    stopNotes();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsPlaying(false);
  }, [stopNotes]);

  // Load and parse the generated MIDI file.
  useEffect(() => {
    let cancelled = false;

    stopPlayback();

    setMidiData(null);
    setDuration(0);
    setCurrentTime(0);
    setPlaybackError("");
    positionRef.current = 0;

    if (!midiUrl) return;

    const loadMidi = async () => {
      try {
        const response = await fetch(midiUrl);

        if (!response.ok) {
          throw new Error("Unable to load the generated MIDI file.");
        }

        const buffer = await response.arrayBuffer();
        const midi = new Midi(buffer);

        if (cancelled) return;

        midiRef.current = midi;
        setMidiData(midi);
        setDuration(midi.duration);
      } catch (err) {
        if (!cancelled) {
          setPlaybackError(err.message);
        }
      }
    };

    loadMidi();

    return () => {
      cancelled = true;
      stopPlayback();
    };
  }, [midiUrl, stopPlayback]);

  // Update the master volume.
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        volume,
        audioContextRef.current.currentTime,
        0.02
      );
    }
  }, [volume]);

  // Release audio resources when the component unmounts.
  useEffect(() => {
    return () => {
      stopNotes();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopNotes]);

  // Create the audio context and piano instrument on demand.
  const initializeAudio = async () => {
    if (instrumentRef.current) return;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Your browser does not support audio playback.");
    }

    const audioContext = new AudioContextClass();
    const gainNode = audioContext.createGain();

    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    gainNodeRef.current = gainNode;

    try {
      const instrument = await Soundfont.instrument(
        audioContext,
        "acoustic_grand_piano",
        { destination: gainNode }
      );

      instrumentRef.current = instrument;
    } catch (err) {
      await audioContext.close();

      audioContextRef.current = null;
      gainNodeRef.current = null;

      throw new Error("Unable to load the piano soundfont.");
    }
  };

  const LOOKAHEAD_SECONDS = 8;

  const playFromPosition = async (position) => {
    const midi = midiRef.current;
    const instrument = instrumentRef.current;
    const audioContext = audioContextRef.current;

    if (!midi || !instrument || !audioContext) return;

    stopNotes();

    const startTime = audioContext.currentTime + 0.1;

    startedAtRef.current = startTime;
    positionRef.current = position;

    // Remaining notes, sorted by start time.
    const queue = midi.tracks
      .flatMap((track) => track.notes)
      .filter((note) => note.time + note.duration > position)
      .sort((a, b) => a.time - b.time);

    let next = 0;

    const scheduleAhead = () => {
      const elapsed = position + (audioContext.currentTime - startTime);

      while (
        next < queue.length &&
        queue[next].time < elapsed + LOOKAHEAD_SECONDS
      ) {
        const note = queue[next++];
        const noteEnd = note.time + note.duration;
        const noteStart = Math.max(note.time, position);

        const source = instrument.play(
          note.name,
          startTime + (noteStart - position),
          {
            duration: noteEnd - noteStart,
            gain: note.velocity,
          }
        );

        if (source) sourcesRef.current.push(source);
      }
    };

    scheduleAhead();
    setIsPlaying(true);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed =
        position + (audioContext.currentTime - startTime);

      if (elapsed >= duration) {
        positionRef.current = 0;
        stopPlayback();
        setCurrentTime(0);
        return;
      }

      scheduleAhead();
      setCurrentTime(Math.max(elapsed, position));
    }, 100);
  };

  const handlePlayPause = async () => {
    if (!midiData || isLoading) return;

    if (isPlaying) {
      const elapsed =
        positionRef.current +
        (audioContextRef.current.currentTime - startedAtRef.current);

      positionRef.current = Math.min(elapsed, duration);
      setCurrentTime(positionRef.current);

      stopPlayback();
      return;
    }

    setIsLoading(true);
    setPlaybackError("");

    try {
      await initializeAudio();

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      if (positionRef.current >= duration) {
        positionRef.current = 0;
        setCurrentTime(0);
      }

      await playFromPosition(positionRef.current);
    } catch (err) {
      setPlaybackError(err.message || "Playback failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeekStart = () => {
    seekWasPlayingRef.current = isPlaying;

    if (isPlaying && audioContextRef.current) {
      const elapsed =
        positionRef.current +
        (audioContextRef.current.currentTime - startedAtRef.current);

      positionRef.current = Math.min(elapsed, duration);
      stopPlayback();
    }
  };

  const handleSeek = (event) => {
    const newPosition = Number(event.target.value);

    positionRef.current = newPosition;
    setCurrentTime(newPosition);
  };

  const handleSeekEnd = () => {
    if (seekWasPlayingRef.current) {
      seekWasPlayingRef.current = false;
      playFromPosition(positionRef.current);
    }
  };

  const handleRestart = () => {
    positionRef.current = 0;
    setCurrentTime(0);

    if (isPlaying) {
      playFromPosition(0);
    }
  };

  const handleDownload = () => {
    if (!midiUrl) return;

    const link = document.createElement("a");
    link.href = midiUrl;
    link.download = "nocturne-composition.mid";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <section className="output-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">OUTPUT</span>
          <h2>Your composition</h2>
          <p>Listen to and download your generated piano piece.</p>
        </div>

        <Music2 size={20} />
      </div>

      {isGenerating ? (
        <div className="output-empty">
          <div className="loading-icon" />
          <h3>Composing your music</h3>
          <p>Your piano composition is being generated...</p>
        </div>
      ) : error ? (
        <div className="output-empty">
          <h3>Generation failed</h3>
          <p className="playback-error">{error}</p>
        </div>
      ) : !midiUrl ? (
        <div className="output-empty">
          <Music2 size={32} />
          <h3>Your music will appear here</h3>
          <p>Generate a composition to start listening.</p>
        </div>
      ) : (
        <div className="player-container">
          <div className="track-information">
            <div className="track-artwork">
              <Music2 size={26} />
            </div>

            <div className="track-details">
              <h3>Generated composition</h3>
              <p>NOCTURNE · Piano</p>
            </div>
          </div>

          <div className="progress-section">
            <input
              className="progress-slider"
              type="range"
              min="0"
              max={duration || 1}
              step="0.1"
              value={Math.min(currentTime, duration)}
              onPointerDown={handleSeekStart}
              onPointerUp={handleSeekEnd}
              onKeyDown={handleSeekStart}
              onKeyUp={handleSeekEnd}
              onChange={handleSeek}
              aria-label="Seek through composition"
            />

            <div className="time-labels">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="player-controls">
            <button
              className="icon-button"
              onClick={handleRestart}
              title="Restart"
              aria-label="Restart"
            >
              <RotateCcw size={19} />
            </button>

            <button
              className="main-play-button"
              onClick={handlePlayPause}
              disabled={isLoading || !midiData}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <span className="button-spinner" />
              ) : isPlaying ? (
                <Pause size={21} fill="currentColor" />
              ) : (
                <Play size={21} fill="currentColor" />
              )}
            </button>

            <div className="volume-control">
              <Volume2 size={18} />

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) =>
                  setVolume(Number(event.target.value))
                }
                aria-label="Volume"
              />
            </div>
          </div>

          {playbackError && (
            <p className="playback-error">{playbackError}</p>
          )}

          <button
            className="download-button"
            onClick={handleDownload}
          >
            <Download size={17} />
            Download MIDI
          </button>
        </div>
      )}
    </section>
  );
}
