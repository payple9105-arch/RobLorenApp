import React, { useState } from "react";
import Register from "./Register";
import ReactDOM from "react-dom/client";
import "./index.css";

function App() {
  const [search, setSearch] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <Register />;
  }
  

  const categories = [
    { icon: "💻", name: "Tecnología" },
    { icon: "🎨", name: "Diseño" },
    { icon: "📱", name: "Marketing" },
    { icon: "✍️", name: "Redacción" },
    { icon: "📚", name: "Educación" },
    { icon: "🔧", name: "Servicios" },
  ];

  const handleSearch = (event) => {
    event.preventDefault();

    if (!search.trim()) {
      alert("Escribe qué servicio estás buscando.");
      return;
    }

    alert(`Buscando: ${search}`);
  };

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <div className="logo">RobLoren</div>

          <nav className="nav">
            <a href="#categorias">Categorías</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a <a
  href="#login"
  onClick={(event) => {
    event.preventDefault();
    setShowRegister(true);
  }}
>
  Iniciar sesión
</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <h1>Encuentra el talento que necesitas.</h1>

            <p>
              RobLoren conecta clientes con profesionales que ofrecen
              servicios de calidad desde cualquier lugar.
            </p>

            <form className="search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="¿Qué servicio necesitas?"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <button type="submit">Buscar</button>
            </form>
          </div>
        </section>

        <section className="section" id="categorias">
          <div className="container">
            <h2>Explora servicios</h2>

            <div className="categories">
              {categories.map((category) => (
                <div className="category" key={category.name}>
                  <div className="category-icon">{category.icon}</div>
                  <h3>{category.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="como-funciona">
          <div className="container">
            <h2>¿Cómo funciona RobLoren?</h2>

            <div className="categories">
              <div className="category">
                <div className="category-icon">🔎</div>
                <h3>1. Busca</h3>
                <p>Encuentra el servicio que necesitas.</p>
              </div>

              <div className="category">
                <div className="category-icon">🤝</div>
                <h3>2. Contrata</h3>
                <p>Elige al profesional adecuado.</p>
              </div>

              <div className="category">
                <div className="category-icon">⭐</div>
                <h3>3. Valora</h3>
                <p>Califica tu experiencia.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2026 RobLoren. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
