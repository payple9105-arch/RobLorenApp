import React, { useState } from "react";
import ReactDOM from "react-dom/client";
const categories = [
  ["💻", "Tecnología"],
  ["🎨", "Diseño"],
  ["📣", "Marketing"],
  ["✍️", "Redacción"],
  ["📚", "Educación"],
  ["🛠️", "Servicios profesionales"],
];
const services = [
  {
    title: "Desarrollo web",
    category: "Tecnología",
    description: "Creación y mantenimiento de sitios web.",
  },
  {
    title: "Diseño gráfico",
    category: "Diseño",
    description: "Logotipos, imágenes y material visual.",
  },
  {
    title: "Marketing digital",
    category: "Marketing",
    description: "Estrategias para hacer crecer tu negocio.",
  },
  {
    title: "Redacción de contenidos",
    category: "Redacción",
    description: "Artículos, textos comerciales y contenido web.",
  },
];
function App() {
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const filteredServices = services.filter((service) => {
    const text = `${service.title} ${service.description} ${service.category}`.toLowerCase();
    return (
      text.includes(search.toLowerCase()) &&
      (category === "" || service.category === category)
    );
  });
  if (page === "services") {
    return (
      <div style={styles.app}>
        <header style={styles.header}>
          <button style={styles.logoButton} onClick={() => setPage("home")}>
            RobLoren
          </button>
          <button style={styles.darkButton} onClick={() => setPage("home")}>
            Inicio
          </button>
        </header>
        <main style={styles.main}>
          <h1>Buscar servicios</h1>
          <p style={styles.subtitle}>
            Encuentra profesionales para lo que necesitas.
          </p>
          <input
            type="text"
            placeholder="¿Qué servicio necesitas?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />
          <div style={styles.categories}>
            <button
              onClick={() => setCategory("")}
              style={{
                ...styles.categoryButton,
                ...(category === "" ? styles.selected : {}),
              }}
            >
              Todos
            </button>
            {categories.map(([icon, name]) => (
              <button
                key={name}
                onClick={() => setCategory(name)}
                style={{
                  ...styles.categoryButton,
                  ...(category === name ? styles.selected : {}),
                }}
              >
                {icon} {name}
              </button>
            ))}
          </div>
          <section style={styles.grid}>
            {filteredServices.map((service) => (
              <div key={service.title} style={styles.card}>
                <span style={styles.badge}>{service.category}</span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <button style={styles.darkButton}>
                  Ver servicio
                </button>
              </div>
            ))}
            {filteredServices.length === 0 && (
              <p>No encontramos servicios con esa búsqueda.</p>
            )}
          </section>
        </main>
      </div>
    );
  }
  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h2 style={{ margin: 0 }}>RobLoren</h2>
        <button style={styles.darkButton}>Iniciar sesión</button>
      </header>
      <main style={styles.main}>
        <h1 style={styles.heroTitle}>
          Encuentra el talento que necesitas.
        </h1>
        <p style={styles.subtitle}>
          RobLoren conecta clientes con profesionales que ofrecen servicios
          desde cualquier lugar.
        </p>
        <div style={styles.actions}>
          <button
            style={styles.darkButton}
            onClick={() => setPage("services")}
          >
            Buscar servicios
          </button>
          <button style={styles.lightButton}>
            Ofrecer mis servicios
          </button>
        </div>
        <section style={styles.grid}>
          {categories.map(([icon, name]) => (
            <div key={name} style={styles.card}>
              <div style={{ fontSize: "35px" }}>{icon}</div>
              <h3>{name}</h3>
              <p>Profesionales especializados.</p>
            </div>
          ))}
        </section>
      </main>
      <footer style={styles.footer}>
        © 2026 RobLoren — Marketplace de servicios profesionales
      </footer>
    </div>
  );
}
const styles = {
  app: {
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    background: "#f5f7fb",
    color: "#172033",
  },
  header: {
    background: "#ffffff",
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
  },
  logoButton: {
    border: "none",
    background: "transparent",
    fontSize: "22px",
    fontWeight: "bold",
    color: "#172033",
    cursor: "pointer",
  },
  main: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "60px 25px",
  },
  heroTitle: {
    fontSize: "clamp(38px, 7vw, 64px)",
    textAlign: "center",
    marginBottom: "20px",
  },
  subtitle: {
    fontSize: "19px",
    color: "#5b6475",
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: "700px",
    margin: "0 auto 35px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  darkButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "9px",
    background: "#172033",
    color: "#ffffff",
    fontSize: "15px",
    cursor: "pointer",
  },
  lightButton: {
    padding: "12px 20px",
    border: "1px solid #172033",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#172033",
    fontSize: "15px",
    cursor: "pointer",
  },
  search: {
    display: "block",
    width: "100%",
    maxWidth: "700px",
    margin: "30px auto",
    padding: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "17px",
    boxSizing: "border-box",
  },
  categories: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "40px",
  },
  categoryButton: {
    padding: "10px 15px",
    border: "1px solid #d1d5db",
    borderRadius: "20px",
    background: "#ffffff",
    cursor: "pointer",
  },
  selected: {
    background: "#172033",
    color: "#ffffff",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
  },
  badge: {
    fontSize: "13px",
    color: "#5b6475",
  },
  footer: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
  },
};
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
