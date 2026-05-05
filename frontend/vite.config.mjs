import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Must match the port the server creates
const DEV_BACKEND_PORT = 3000;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": `http://localhost:${DEV_BACKEND_PORT}`,
    },
  },
});
