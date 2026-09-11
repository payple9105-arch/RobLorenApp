import React from "react";
import ReactDOM from "react-dom/client";
function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        background: "#f5f7fb",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          padding: "20px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ margin: 0 }}>RobLoren</h2>
        <button
          style={{
            padding: "10px 18px",
            border: "none",
            borderRadius: "8px",
            background: "#172033",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          Iniciar sesión
        </button>
      </header>
      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "70px 25px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(38px, 7vw, 64px)",
            marginBottom: "20px",
          }}
        >
          Encuentra el talento que necesitas.
        </h1>
        <p
          style={{
            fontSize: "20px",
            color: "#5b6475",
            maxWidth: "700px",
            margin: "0 auto 35px",
            lineHeight: 1.6,
          }}
        >
          RobLoren conecta clientes con profesionales que ofrecen servicios
          desde cualquier lugar.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              padding: "14px 24px",
              border: "none",
              borderRadius: "10px",
              background: "#172033",
              color: "#ffffff",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Buscar servicios
          </button>
          <button
            style={{
              padding: "14px 24px",
              border: "1px solid #172033",
              borderRadius: "10px",
              background: "#ffffff",
              color: "#172033",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Ofrecer mis servicios
          </button>
        </div>
        <section
          style={{
            marginTop: "70px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            ["💻", "Tecnología"],
            ["🎨", "Diseño"],
            ["📣", "Marketing"],
            ["✍️", "Redacción"],
          ].map(([icon, title]) => (
            <div
              key={title}
              style={{
                background: "#ffffff",
                padding: "30px 20px",
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "35px" }}>{icon}</div>
              <h3>{title}</h3>
              <p style={{ color: "#6b7280" }}>
                Profesionales especializados.
              </p>
            </div>
          ))}
        </section>
      </main>
      <footer
        style={{
          textAlign: "center",
          padding: "30px",
          color: "#6b7280",
        }}
      >
        © 2026 RobLoren — Marketplace de servicios profesionales
      </footer>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
