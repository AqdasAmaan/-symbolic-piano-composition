const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Strip trailing slashes so "http://host:8000/" doesn't produce "//api/...".
// An empty value is valid and means "same origin": requests go to /api on
// whatever host served the page (dev-server proxy, or the single-container
// deployment). Only a completely missing variable is a configuration error.
const API_BASE_URL = (rawBaseUrl ?? "").replace(/\/+$/, "");

// Don't throw at import time: that blanks the whole page. The UI reads
// this flag and explains the problem instead.
export const isApiConfigured = rawBaseUrl !== undefined;

const CONFIG_ERROR =
  "The API address isn't configured. Set VITE_API_BASE_URL in " +
  "frontend/.env (leave it empty to use the same address as the site) " +
  "and restart the dev server.";

// Long generations on CPU can be slow, so keep this generous.
const GENERATION_TIMEOUT_MS = 5 * 60 * 1000;

function withTimeout(signal, ms) {
  const timeout = AbortSignal.timeout(ms);

  if (!signal) return timeout;

  // AbortSignal.any is available in all current browsers; without it we
  // still honour the caller's cancel signal, just without the timeout.
  return AbortSignal.any ? AbortSignal.any([signal, timeout]) : signal;
}

function toFriendlyError(error) {
  // User-initiated cancel: let the caller recognise and ignore it.
  if (error?.name === "AbortError") return error;

  if (error?.name === "TimeoutError") {
    return new Error(
      "Generation timed out. Try a shorter length and generate again."
    );
  }

  // fetch() rejects with a TypeError when the server is unreachable.
  if (error instanceof TypeError) {
    return new Error(
      "Cannot reach the backend. Make sure the server is running."
    );
  }

  return error;
}

export async function generateComposition(settings, { signal } = {}) {
  if (!isApiConfigured) throw new Error(CONFIG_ERROR);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        max_new_tokens: settings.maxNewTokens,
        temperature: settings.temperature,
        top_k: settings.topK ?? 15,
        top_p: settings.topP ?? 0.95,
      }),
      signal: withTimeout(signal, GENERATION_TIMEOUT_MS),
    });
  } catch (error) {
    throw toFriendlyError(error);
  }

  if (!response.ok) {
    let message = `Music generation failed (HTTP ${response.status}).`;

    // Proxies and tunnels give up on slow requests with these statuses.
    if (response.status === 504 || response.status === 524) {
      message =
        "The connection timed out before the music was ready. " +
        "Try a shorter length.";
    }

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  try {
    return await response.blob();
  } catch (error) {
    throw toFriendlyError(error);
  }
}


export async function checkModelHealth() {
  if (!isApiConfigured) throw new Error(CONFIG_ERROR);

  const response = await fetch(`${API_BASE_URL}/api/health`, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error("Health check failed.");
  }

  return response.json();
}