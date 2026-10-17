import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function ProductDetailPage({ product, user, onBack, onOrderCreated }) {
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");

  if (!product) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>Producto no encontrado.</p>
        <button className="button outline" onClick={onBack}>Volver</button>
      </main>
    );
  }

  const buyProduct = async () => {
    if (!user) {
      alert("Debes iniciar sesión para comprar");
      return;
    }

    setBuying(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_id: product.id,
          amount: product.price,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setMessage("Pedido creado correctamente. La comisión se registró automáticamente.");
      onOrderCreated?.(data);
    } catch (err) {
      console.error(err);
      setMessage("No se pudo crear el pedido. Inténtalo de nuevo.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <main className="page-container">
      <button className="button outline" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Volver a la tienda
      </button>

      <div className="offer-layout">
        <div>
          <img
            src={product.image_url || "/media/design.jpg"}
            alt={product.title}
            style={{ width: "100%", borderRadius: 16, maxHeight: 420, objectFit: "cover" }}
          />
        </div>

        <div>
          <span className="category-pill">{product.category || "Producto"}</span>
          {product.is_featured && (
            <span className="category-pill" style={{ background: "#f59e0b", color: "#fff", marginLeft: 8 }}>
              Destacado
            </span>
          )}

          <h1 style={{ marginTop: 12 }}>{product.title}</h1>

          <div style={{ fontSize: 32, fontWeight: 700, margin: "12px 0" }}>
            ${product.price}
          </div>

          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            {product.description || "Sin descripción."}
          </p>

          <div style={{ marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
            {product.product_type === "digital" && "Descarga digital inmediata"}
            {product.product_type === "physical" && `Envío disponible · Stock: ${product.stock ?? "—"}`}
            {product.product_type === "both" && "Digital y físico"}
          </div>

          <button
            className="button primary large"
            style={{ marginTop: 24, width: "100%" }}
            disabled={buying || product.stock === 0}
            onClick={buyProduct}
          >
            {buying ? "Procesando..." : product.stock === 0 ? "Agotado" : "Comprar ahora"}
          </button>

          {message && (
            <p style={{ marginTop: 16, color: message.includes("correctamente") ? "#16a34a" : "#dc2626" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
