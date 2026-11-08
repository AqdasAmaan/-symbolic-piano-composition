
import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Composer from "./components/Composer";
import OutputPanel from "./components/OutputPanel";
import { generateComposition, checkModelHealth } from "./services/api";

import "./App.css";

function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [midiUrl, setMidiUrl] = useState(null);
  const [error, setError] = useState("");

  const [modelStatus, setModelStatus] = useState({
    state: "checking",
    device: null,
  });

  // Monitor backend and model readiness.
  useEffect(() => {
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

  const handleGenerate = async (settings) => {
    setIsGenerating(true);
    setError("");

    try {
      const midiBlob = await generateComposition(settings);
      const newMidiUrl = URL.createObjectURL(midiBlob);

      setMidiUrl(newMidiUrl);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar modelStatus={modelStatus} />

      <main className="main-area">
        <Header />

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
              isGenerating={isGenerating}
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
    </div>
  );
}

export default App;
