import { createRoot } from "react-dom/client";
import { Buffer } from "buffer";
import process from "process";
import App from "./App.tsx";
import "./index.css";

// Polyfills obrigatórios ANTES de qualquer outro import
window.Buffer = window.Buffer || Buffer;
window.process = window.process || process;
window.global = window;

createRoot(document.getElementById("root")!).render(<App />);
