// Configuração do Vite: o plugin do React entende JSX/TSX
// e o plugin do Tailwind v4 processa as classes utilitárias.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
