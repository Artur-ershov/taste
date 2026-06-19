import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static SPA. base "./" keeps it portable across hosts (Vercel, GitHub Pages, etc.).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
