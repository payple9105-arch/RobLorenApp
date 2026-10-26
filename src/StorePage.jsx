import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const categories = [
  "Todas",
  "Diseño",
  "Educación",
  "Ropa",
  "Música",
  "Fotografía",
  "Artesanía",
  "Tecnología",
  "Otros",
];

export default function StorePage({ onViewProduct, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("is_featured", { ascending: false })
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
    let list = products.filter((p) => {
      const matchCat = category === "Todas" || p.category === category;
      if (!text) return matchCat;
      const content =
        `${p.title || ""} ${p.description || ""} ${p.category || ""}`.toLowerCase();
      return matchCat && content.includes(text);
    });

    if (sort === "price_asc") {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price_desc") {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "new") {
      list = [...list].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    } else {
      list = [...list].sort((a, b) => {
        if (a.is_featured === b.is_featured) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return a.is_featured ? -1 : 1;
      });
    }

    return list;
  }, [products, search, category, sort]);

  const handleAddToCart = (product, e) => {
    e?.stopPropagation?.();
    onAddToCart?.(product);
  };

  if (loading) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", color: "var(--muted)", marginTop: 60 }}>
          Cargando tienda...
        </p>
      </main>
    );
  }

  return (
    <main className="page-container" style={{ maxWidth: 1180 }}>
      <header style={{ marginBottom: 18 }}>
        <span className="eyebrow">TIENDA</span>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.03em", marginTop: 4 }}>
          Tienda RobLoren
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 6 }}>
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
          {category !== "Todas" ? ` en ${category}` : ""}
        </p>
      </header>

      {/* Buscador */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid #d5dbe5",
            borderRadius: 12,
            padding: "10px 14px",
            background: "#fff",
          }}
        >
          <span style={{ color: "#8a97ab", fontSize: 18 }}>⌕</span>
          <input
            type="search"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 0,
              outline: "none",
              width: "100%",
              font: "inherit",
              fontSize: 15,
              background: "transparent",
            }}
          />
        </div>
      </div>

      {/* Categorías */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 12,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {categories.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              style={{
                flex: "0 0 auto",
                border: active ? "1px solid #1f6feb" : "1px solid #e6ebf2",
                background: active ? "#e8f1ff" : "#fff",
                color: active ? "#1558c4" : "#334155",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Orden */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          Ordenar por
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            border: "1px solid #e6ebf2",
            borderRadius: 10,
            padding: "8px 12px",
            font: "inherit",
            fontSize: 13,
            background: "#fff",
          }}
        >
          <option value="featured">Destacados</option>
          <option value="new">Más recientes</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 16px",
            color: "var(--muted)",
            border: "1px dashed #e6ebf2",
            borderRadius: 16,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
            No hay productos todavía
          </p>
          <p style={{ marginTop: 6, fontSize: 14 }}>
            Cuando se publiquen, aparecerán aquí como un catálogo profesional.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((product) => {
            const outOfStock = product.stock === 0;
            return (
              <article
                key={product.id}
                onClick={() => onViewProduct?.(product)}
                style={{
                  background: "#fff",
                  border: "1px solid #e8edf4",
                  borderRadius: 14,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s ease",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    background: "#f4f6fa",
                    aspectRatio: "1 / 1",
                  }}
                >
                  <img
                    src={product.image_url || "/media/design.jpg"}
                    alt={product.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {product.is_featured && (
                    <span
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: "#f59e0b",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                      }}
                    >
                      Destacado
                    </span>
                  )}
                  {outOfStock && (
                    <span
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(255,255,255,0.72)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      Agotado
                    </span>
                  )}
                </div>

                <div
                  style={{
                    padding: "12px 12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {product.category || "Producto"}
                  </div>

                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: 1.35,
                      color: "#0f172a",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "2.7em",
                    }}
                  >
                    {product.title}
                  </h3>

                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#0f172a",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    ${Number(product.price || 0).toFixed(2)}
                  </div>

                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {product.product_type === "digital"
                      ? "Descarga inmediata"
                      : product.product_type === "physical"
                        ? `Envío · Stock ${product.stock ?? "—"}`
                        : "Digital y físico"}
                  </div>

                  <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                    <button
                      type="button"
                      className="button outline small"
                      style={{ flex: 1, minHeight: 36, fontSize: 12 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProduct?.(product);
                      }}
                    >
                      Ver
                    </button>
                    <button
                      type="button"iggl                      className="button primary small"
                      style={{ flex: 1, minHeight: 36, fontSize: 12 }}
                      disabled={outOfStock}
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      {outOfStock ? "Agotado" : "Añadir"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
