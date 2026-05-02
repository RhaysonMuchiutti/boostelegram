import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Removemos os polyfills complexos do main.tsx que podem estar causando crash prematuro
createRoot(document.getElementById("root")!).render(<App />);