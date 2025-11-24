import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

// Configure StatusBar for native apps
if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Default }).catch(console.error);
  StatusBar.setOverlaysWebView({ overlay: false }).catch(console.error);
}

createRoot(document.getElementById("root")!).render(<App />);
