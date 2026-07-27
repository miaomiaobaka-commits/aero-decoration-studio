import React from "react";
import { createRoot } from "react-dom/client";
import AeroStudio from "../app/AeroStudio";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AeroStudio />
  </React.StrictMode>,
);
