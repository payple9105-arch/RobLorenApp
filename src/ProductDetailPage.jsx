import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import PayPalCheckout from "./PayPalCheckout";
import { notifyOrder } from "./notify";

export default function ProductDetailPage({ product, user, onBack, onOrderCreated, onAddToCart }) {
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");
  const [qty, setQty] = useState(1);
  const [showPayPal, setShowPayPal] = useState(false);

  if (!product) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>Producto no encontrado.</p>
        <button className="button outline" onClick={onBack}>Volver</button>
      </main>
    );
  }

  const total = (Number(product.price) || 0) * qty;

  const startCheckout = () => {
    if (!user) {
      setMessage("Debes iniciar sesión para comprar.");
      return;
    }
    if (!product.seller_id) {
      setMessage("Este producto no tiene vendedor asignado. No se puede comprar.");
      return;
    }
    if (product.stock === 0) {
      setMessage("Producto agotado.");
      return;
    }
    setShowPayPal(true);
    setMessage("");
  };

  const handlePaid = async (details) => {
    setBuying(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_id: product.id,
          amount: total,
          total: total,
          status: "paid",
          paypal_order_id: details?.id || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creando pedido:", error);
        setMessage(`Pago recibido, pero hubo un error al guardar el pedido: ${error.message}`);
        return;
      }

      if (product.stock !== null && product.stock !== undefined) {
        await supabase
          .from("products")
          .update({ stock: Math.max(0, (product.stock || 0) - qty) })
          .eq("id", product.id);
      }

      if (data) {
        await notifyOrder({ type: "INSERT", record: data });
        onOrderCreated?.(data);
      }

      setShowPayPal(false);
      setMessage("Pago completado. Pedido creado correctamente.");
    } catch (err) {
      console.error(err);
      setMessage("Pago recibido, pero hubo un error al guardar el pedido.");
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

          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>Cantidad:</span>
            <button
              className="button outline small"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={showPayPal}
            >
              −
            </button>
            <span style={{ minWidth: 28, textAlign: "center", fontWeight: 600 }}>{qty}</span>
            <button
              className="button outline small"
              onClick={() => setQty((q) => q + 1)}
              disabled={showPayPal}
            >
              +
            </button>
          </div>

          {!showPayPal ? (
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                className="button outline large"
                style={{ flex: 1 }}
                onClick={() => {
                  const productWithQty = { ...product, qty };
                  onAddToCart?.(productWithQty);
                  alert(`${qty} producto${qty > 1 ? "s" : ""} añadido${qty > 1 ? "s" : ""} al carrito`);
                }}
              >
                Añadir al carrito
              </button>
              <button
                className="button primary large"
                style={{ flex: 1 }}
                disabled={buying || product.stock === 0}
                onClick={startCheckout}
              >
                {product.stock === 0 ? "Agotado" : "Comprar ahora"}
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 18 }}>
                Total a pagar: ${total.toFixed(2)}
              </div>
              <PayPalCheckout
                amount={total}
                description={`${product.title} x${qty}`}
                onPaid={handlePaid}
                onError={() => setMessage("Error en el pago. Inténtalo de nuevo.")}
              />
              <button
                className="button outline"
                style={{ width: "100%", marginTop: 12 }}
                onClick={() => setShowPayPal(false)}
                disabled={buying}
              >
                Cancelar
              </button>
            </div>
          )}

          {message && (
            <p
              style={{
                marginTop: 16,
                color:
                  message.includes("completado") || message.includes("correctamente")
                    ? "#16a34a"
                    : "#dc2626",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
