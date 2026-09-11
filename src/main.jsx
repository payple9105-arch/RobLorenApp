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
    id: 1,
    title: "Desarrollo web",
    category: "Tecnología",
    description: "Creación y mantenimiento de sitios web.",
    price: "Consultar precio",
    professional: "Alex Rodríguez",
    profession: "Desarrollador web",
    bio: "Profesional especializado en creación de sitios web y aplicaciones.",
  },
  {
    id: 2,
    title: "Diseño gráfico",
    category: "Diseño",
    description: "Logotipos, imágenes y material visual.",
    price: "Consultar precio",
    professional: "María García",
    profession: "Diseñadora gráfica",
    bio: "Diseñadora enfocada en identidad visual, logotipos y contenido digital.",
  },
  {
    id: 3,
    title: "Marketing digital",
    category: "Marketing",
    description: "Estrategias para hacer crecer tu negocio.",
    price: "Consultar precio",
    professional: "Carlos Pérez",
    profession: "Especialista en marketing",
    bio: "Ayudo a negocios a mejorar su presencia digital y conseguir clientes.",
  },
  {
    id: 4,
    title: "Redacción de contenidos",
    category: "Redacción",
    description: "Artículos, textos comerciales y contenido web.",
    price: "Consultar precio",
    professional: "Laura Martínez",
    profession: "Redactora profesional",
    bio: "Redactora especializada en contenidos web, artículos y comunicación comercial.",
  },
];
function App() {
  const [page, setPage] = useState("home");
  const [selectedService, setSelectedService] = useState(null);
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
      `${service.title} ${service.description} ${service.category} ${service.professional}`.toLowerCase();
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
      id: Date.now(),
      title: form.title,
      category: form.category,
      description: form.description,
      price: `$${form.price} USD`,
      professional: form.name,
      profession: form.profession,
      bio: `Profesional especializado en ${form.profession}.`,
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
  function openProfile(service) {
    setSelectedService(service);
    setPage("profile");
  }
  if (page === "profile" && selectedService) {
    return (
      <div style={styles.app}>
        <Header setPage={setPage} />
        <main style={styles.profileContainer}>
          <button
            style={styles.backButton}
            onClick={() => setPage("services")}
          >
            ← Volver a servicios
          </button>
          <div style={styles.profileCard}>
            <div style={styles.avatar}>
              {selectedService.professional.charAt(0).toUpperCase()}
            </div>
            <h1>{selectedService.professional}</h1>
            <h3>{selectedService.profession}</h3>
            <p style={styles.bio}>{selectedService.bio}</p>
            <div style={styles.profileSection}>
              <span style={styles.badge}>
                {selectedService.category}
              </span>
              <h2>{selectedService.title}</h2>
              <p>{selectedService.description}</p>
              <div style={styles.price}>
                {selectedService.price}
              </div>
            </div>
            <button
              style={styles.contactButton}
              onClick={() =>
                alert(
                  `Contacto con ${selectedService.professional}. Próximamente añadiremos mensajería.`
                )
              }
            >
              💬 Contactar
            </button>
          </div>
        </main>
      </div>
    );
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
            {filteredServices.map((service) => (
              <div key={service.id} style={styles.card}>
                <div style={styles.avatarSmall}>
                  {service.professional.charAt(0).toUpperCase()}
                </div>
                <span style={styles.badge}>{service.category}</span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <p>
                  <strong>{service.professional}</strong>
                  <br />
                  {service.profession}
                </p>
                <strong>{service.price}</strong>
                <br />
                <br />
                <button
                  style={styles.darkButton}
                  onClick={() => openProfile(service)}
                >
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
            Crea tu publicación profesional en RobLoren.
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
      <button
        style={styles.logoButton}
        onClick={() => setPage("home")}
      >
        RobLoren
      </button>
      <button
        style={styles.darkButton}
        onClick={() => setPage("home")}
      >
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
  backButton: {
    border: "none",
    background: "transparent",
    color: "#172033",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "20px",
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
    display: "inline-block",
    fontSize: "13px",
    color: "#5b6475",
    marginTop: "12px",
  },
  avatarSmall: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
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
  profileContainer: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "50px 25px",
  },
  profileCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "35px",
    textAlign: "center",
  },
  avatar: {
    width: "90px",
    height: "90px",
    margin: "0 auto 20px",
    borderRadius: "50%",
    background: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    fontWeight: "bold",
  },
  bio: {
    color: "#5b6475",
    lineHeight: 1.6,
    margin: "20px auto 30px",
  },
  profileSection: {
    textAlign: "left",
    background: "#f5f7fb",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "25px",
  },
  price: {
    fontSize: "22px",
    fontWeight: "bold",
    marginTop: "20px",
  },
  contactButton: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "9px",
    background: "#172033",
    color: "#ffffff",
    fontSize: "17px",
    cursor: "pointer",
  },
  footer: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
  },
};
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

Después:

Comm

Cuando termine, dime “Listo” y comprobamos que GitHub lo haya publicado correctamente.
