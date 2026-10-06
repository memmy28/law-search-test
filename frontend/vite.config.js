import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Im Dev-Modus laufen Vite (5173) und Flask (5050) getrennt; alle /api-Aufrufe
// werden an Flask durchgereicht, damit der app_state-Cookie same-origin bleibt.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:5050",
    },
  },
});
