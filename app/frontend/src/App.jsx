import { useEffect, useRef, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Composer from "./components/Composer";
import OutputPanel from "./components/OutputPanel";
import HelpDialog from "./components/HelpDialog";
import {
  generateComposition,
  checkModelHealth,
  isApiConfigured,
} from "./services/api";

import "./App.css";

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [midiUrl, setMidiUrl] = useState(null);
  const [error, setError] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const abortRef = useRef(null);

  const [modelStatus, setModelStatus] = useState({
    state: isApiConfigured ? "checking" : "misconfigured",
    device: null,
  });

  // Monitor backend and model readiness.
  useEffect(() => {
    if (!isApiConfigured) return;

    let isMounted = true;
    let isChecking = false;

    const checkHealth = async () => {
      if (isChecking) return;

      isChecking = true;

      try {
        const health = await checkModelHealth();

        if (!isMounted) return;

        setModelStatus({
          state:
            health.backend === "online" && health.model_loaded
              ? "ready"
              : "not_ready",
          device: health.device,
        });
      } catch {
        if (!isMounted) return;

        setModelStatus({
          state: "offline",
          device: null,
        });
      } finally {
        isChecking = false;
      }
    };

    checkHealth();

    const intervalId = setInterval(checkHealth, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Revoke the previous MIDI URL when replaced or unmounted.
  useEffect(() => {
    return () => {
      if (midiUrl) {
        URL.revokeObjectURL(midiUrl);
      }
    };
  }, [midiUrl]);

  // Abort any in-flight request when the app unmounts.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleGenerate = async (settings) => {
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setError("");

    try {
      const midiBlob = await generateComposition(settings, {
        signal: controller.signal,
      });
      const newMidiUrl = URL.createObjectURL(midiBlob);

      setMidiUrl(newMidiUrl);
    } catch (err) {
      // A user cancel is not an error; keep the previous composition.
      if (err.name !== "AbortError") {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  // Clear the workspace for a fresh start.
  const handleNewComposition = () => {
    if (
      midiUrl &&
      !window.confirm(
        "Start a new composition? The current one will be discarded " +
          "(download it first if you want to keep it)."
      )
    ) {
      return;
    }

    abortRef.current?.abort();
    setMidiUrl(null);
    setError("");
  };

  return (
    <div className="app-layout">
      <Sidebar
        modelStatus={modelStatus}
        onNewComposition={handleNewComposition}
        onHelp={() => setIsHelpOpen(true)}
      />

      <main className="main-area">
        <Header onHelp={() => setIsHelpOpen(true)} />

        <div className="workspace">
          <div className="welcome-section">
            <span className="eyebrow">AI-POWERED MUSIC GENERATION</span>
            <h1>Compose something timeless.</h1>
            <p>
              Turn your ideas into original piano compositions
              with the power of generative AI.
            </p>
          </div>

          <div className="workspace-grid">
            <Composer
              onGenerate={handleGenerate}
              onCancel={handleCancel}
              isGenerating={isGenerating}
              modelStatus={modelStatus}
            />

            <OutputPanel
              midiUrl={midiUrl}
              error={error}
              isGenerating={isGenerating}
            />
          </div>

          <footer className="app-footer">
            <span>NOCTURNE</span>
            <span>Symbolic Piano Music Generation</span>
          </footer>
        </div>
      </main>

      <HelpDialog
        open={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

export default App;