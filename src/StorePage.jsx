import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const categories = ["Todas", "Diseño", "Educación", "Ropa", "Música", "Fotografía", "Artesanía", "Tecnología"];

export default function StorePage({ onViewProduct, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando productos:", error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = category === "Todas" || p.category === category;
      if (!text) return matchCat;
      const content = `${p.title || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
      return matchCat && content.includes(text);
    });
  }, [products, search, category]);

  const handleAddToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    onAddToCart?.(product);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (loading) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", color: "var(--muted)", marginTop: 60 }}>
          Cargando productos...
        </p>
      </main>
    );
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TIENDA</span>
            <h1>Productos de profesionales</h1>
            <p>Compra plantillas, ropa, música, artesanías y más.</p>
          </div>
          {cartCount > 0 && (
            <button className="button primary" type="button">
              Carrito ({cartCount})
            </button>
          )}
        </div>
      </header>

      <div className="search-section" style={{ margin: "0 0 24px" }}>
        <div className="search-box compact">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="filters-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={category === cat ? "button primary" : "button outline"}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)", marginTop: 40 }}>
          No hay productos disponibles todavía.
        </p>
      ) : (
        <div className="services-grid">
          {filtered.map((product) => (
            <article className="service-card" key={product.id}>
              <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
                <img
                  src={product.image_url || "/media/design.jpg"}
                  alt={product.title}
                  style={{ width: "100%", height: 180, objectFit: "cover" }}
                />
              </div>

              <div className="service-card-top">
                <span className="category-pill">{product.category || "Producto"}</span>
                <strong className="service-price">${product.price}</strong>
              </div>

              <h3>{product.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
                {(product.description || "").slice(0, 80)}
                {(product.description || "").length > 80 ? "..." : ""}
              </p>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  className="button outline"
                  style={{ flex: 1 }}
                  onClick={() => onViewProduct?.(product)}
                >
                  Ver producto
                </button>
                <button
                  type="button"
                  className="button primary"
                  style={{ flex: 1 }}
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? "Agotado" : "Añadir"}
                </button>
              </div>

              {product.product_type === "physical" && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  Envío disponible · Stock: {product.stock}
                </div>
              )}
              {product.product_type === "digital" && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  Descarga digital inmediata
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
