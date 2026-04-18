import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FirebaseBanner } from "./components/FirebaseBanner.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FirebaseBanner />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
