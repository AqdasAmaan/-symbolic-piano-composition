import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Where the FastAPI backend listens during development. Use 127.0.0.1
// instead of "localhost": on Windows, Node can resolve localhost to ::1
// (IPv6), which uvicorn does not listen on by default.
const API_TARGET = process.env.DEV_API_TARGET || 'http://127.0.0.1:8000'

// Forward /api to the backend so the browser only ever talks to ONE origin.
// That means no CORS setup, no extra firewall port, and a single tunnel is
// enough to test from another device (set VITE_API_BASE_URL to empty).
const proxy = {
  '/api': { target: API_TARGET, changeOrigin: true },
}

// Public hostnames allowed to reach the dev server through a tunnel. Vite
// rejects unknown Host headers (DNS-rebinding protection), so a tunnel URL
// is blocked until its domain is listed. Avoid `allowedHosts: true`: that
// disables the check entirely. Add your tunnel's domain here if it differs.
const allowedHosts = [
  '.trycloudflare.com',
  '.ngrok-free.app',
  '.ngrok-free.dev',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy, allowedHosts },
  preview: { proxy, allowedHosts },
})