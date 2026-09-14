import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

// GitHub Pages has no SPA rewrite rules. Hash routes keep shared URLs and
// refreshes on its real /pitcher_site/ index, including lazy-loaded 3D assets.
const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
