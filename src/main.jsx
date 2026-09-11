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
const initialServices = [
  {
    title: "Desarrollo web",
    category: "Tecnología",
    description: "Creación y mantenimiento de sitios web.",
    price: "Consultar precio",
  },
  {
    title: "Diseño gráfico",
    category: "Diseño",
    description: "Logotipos, imágenes y material visual.",
    price: "Consultar precio",
  },
  {
    title: "Marketing digital",
    category: "Marketing",
    description: "Estrategias para hacer crecer tu negocio.",
    price: "Consultar precio",
  },
  {
    title: "Redacción de contenidos",
    category: "Redacción",
    description: "Artículos, textos comerciales y contenido web.",
    price: "Consultar precio",
  },
];
function App() {
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [services, setServices] = useState(initialServices);
  const [form, setForm] = useState({
    name: "",
    profession: "",
    title: "",
    description: "",
    category: "Tecnología",
    price: "",
  });
  const filteredServices = services.filter((service) => {
    const text =
      `${service.title} ${service.description} ${service.category}`.toLowerCase();
    return (
      text.includes(search.toLowerCase()) &&
      (category === "" || service.category === category)
    );
  });
  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }
  function publishService(event) {
    event.preventDefault();
    if (
      !form.name ||
      !form.profession ||
      !form.title ||
      !form.description ||
      !form.price
    ) {
      alert("Completa todos los campos antes de publicar.");
      return;
    }
    const newService = {
      title: form.title,
      category: form.category,
      description: form.description,
      price: `$${form.price}`,
      professional: form.name,
      profession: form.profession,
    };
    setServices([newService, ...services]);
    setForm({
      name: "",
      profession: "",
      title: "",
      description: "",
      category: "Tecnología",
      price: "",
    });
    alert("¡Tu servicio fue publicado en RobLoren!");
    setPage("services");
  }
  if (page === "services") {
    return (
      <div style={styles.app}>
        <Header setPage={setPage} />
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
            {filteredServices.map((service, index) => (
              <div key={`${service.title}-${index}`} style={styles.card}>
                <span style={styles.badge}>{service.category}</span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                {service.professional && (
                  <p>
                    <strong>Profesional:</strong> {service.professional}
                    <br />
                    <strong>Especialidad:</strong> {service.profession}
                  </p>
                )}
                <strong>{service.price}</strong>
                <br />
                <br />
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
  if (page === "offer") {
    return (
      <div style={styles.app}>
        <Header setPage={setPage} />
        <main style={styles.formContainer}>
          <h1>Ofrece tus servicios</h1>
          <p style={styles.subtitle}>
            Crea tu primera publicación y permite que clientes te encuentren.
          </p>
          <form onSubmit={publishService} style={styles.form}>
            <label>Tu nombre</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. Roberto Pérez"
              style={styles.input}
            />
            <label>Profesión o especialidad</label>
            <input
              name="profession"
              value={form.profession}
              onChange={handleChange}
              placeholder="Ej. Diseñador gráfico"
              style={styles.input}
            />
            <label>Nombre del servicio</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej. Diseño de logotipos"
              style={styles.input}
            />
            <label>Categoría</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={styles.input}
            >
              {categories.map(([icon, name]) => (
                <option key={name} value={name}>
                  {icon} {name}
                </option>
              ))}
            </select>
            <label>Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe lo que ofreces..."
              style={{ ...styles.input, minHeight: "120px" }}
            />
            <label>Precio inicial (USD)</label>
            <input
              name="price"
              type="number"
              min="1"
              value={form.price}
              onChange={handleChange}
              placeholder="Ej. 25"
              style={styles.input}
            />
            <button type="submit" style={styles.publishButton}>
              Publicar mi servicio
            </button>
          </form>
        </main>
      </div>
    );
  }
  return (
    <div style={styles.app}>
      <Header setPage={setPage} />
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
          <button
            style={styles.lightButton}
            onClick={() => setPage("offer")}
          >
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
function Header({ setPage }) {
  return (
    <header style={styles.header}>
      <button style={styles.logoButton} onClick={() => setPage("home")}>
        RobLoren
      </button>
      <button style={styles.darkButton} onClick={() => setPage("home")}>
        Inicio
      </button>
    </header>
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
  formContainer: {
    maxWidth: "650px",
    margin: "0 auto",
    padding: "60px 25px",
  },
  form: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "15px",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    width: "100%",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    boxSizing: "border-box",
    marginBottom: "12px",
  },
  publishButton: {
    padding: "14px",
    border: "none",
    borderRadius: "9px",
    background: "#172033",
    color: "#ffffff",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  },
  footer: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
  },
};
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
