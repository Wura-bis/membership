import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/authcontext";
import { ToastProvider } from "./components/toast";
import "./index.css";

// Apply saved display settings before React renders so every page respects them
(function () {
  try {
    const saved = localStorage.getItem('appSettings');
    if (!saved) return;
    const s = JSON.parse(saved);
    const fontSizes = { small: '14px', medium: '16px', large: '18px', 'extra-large': '22px' };
    if (fontSizes[s.fontSize]) {
      document.documentElement.style.fontSize = fontSizes[s.fontSize];
    }
    const themes = {
      dark: {
        '--bg-primary': '#0f172a', '--bg-secondary': '#1e293b',
        '--bg-gradient-start': '#0f172a', '--bg-gradient-mid': '#1e293b', '--bg-gradient-end': '#0f172a',
        '--text-primary': '#f1f5f9', '--text-secondary': '#94a3b8', '--text-accent': '#5eead4',
        '--border-primary': '#334155', '--border-accent': '#14b8a6',
        '--card-bg': '#1e293b', '--card-hover': '#334155'
      },
      'high-contrast': {
        '--bg-primary': '#ffffff', '--bg-secondary': '#f8fafc',
        '--bg-gradient-start': '#ffffff', '--bg-gradient-mid': '#f8fafc', '--bg-gradient-end': '#ffffff',
        '--text-primary': '#000000', '--text-secondary': '#334155', '--text-accent': '#047857',
        '--border-primary': '#000000', '--border-accent': '#047857',
        '--card-bg': '#ffffff', '--card-hover': '#f1f5f9'
      }
    };
    if (themes[s.theme]) {
      Object.entries(themes[s.theme]).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    }
    if (s.contrast === 'high') {
      document.documentElement.style.setProperty('--text-weight-normal', '600');
      document.documentElement.style.setProperty('--text-weight-bold', '800');
      document.documentElement.style.setProperty('--border-width', '3px');
    }
    if (s.animations === false) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    }
  } catch (e) { /* ignore corrupt localStorage */ }
})();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
