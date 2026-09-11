import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div>
      <h1>RobLoren</h1>
      <p>Marketplace de servicios profesionales</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
