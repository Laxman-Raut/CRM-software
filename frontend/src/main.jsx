import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import { SettingsProvider } from "./context/SettingsContext";
ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </ThemeProvider>
);