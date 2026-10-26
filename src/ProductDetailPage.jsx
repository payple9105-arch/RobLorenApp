import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import PayPalCheckout from "./PayPalCheckout";
import { notifyOrder } from "./notify";

function Stars({ value = 0, size = 16 }) {
  const v = Math.round(Number(value) || 0);
  return (
    <span style={{ color: "#f5b400", fontSize: size, letterSpacing: 1 }} aria-label={`${v} de 5`}>
      {"★".repeat(Math.min(5, Math.max(0, v)))}
      <span style={{ color: "#d1d5db" }}>{"★".repeat(Math.max(0, 5 - v))}</span>
    </span>
  );
}

export default function ProductDetailPage({
  product,
  user,
  onBack,
  onOrderCreated,
  onAddToCart,
}) {
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");
  const [qty, setQty] = useState(1);
  const [showPayPal, setShowPayPal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (!product?.id) return;
    loadReviews();
  }, [product?.id]);

  const loadReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer_id")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const list = data || [];
    setReviews(list);
    if (list.length) {
      const avg =
        list.reduce((s, r) => s + Number(r.rating || 0), 0) / list.length;
      setAvgRating(avg);
    } else {
      setAvgRating(0);
    }
  };

  if (!product) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>Producto no encontrado.</p>
        <button className="button outline" onClick={onBack}>
          Volver
        </button>
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
      const paypalOrderId = details?.id;
      if (!paypalOrderId) {
        setMessage("No se recibió el ID de pago de PayPal.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("confirm-payment", {
        body: {
          paypal_order_id: paypalOrderId,
          items: [{ product_id: product.id, qty }],
        },
      });

      if (error) {
        console.error(error);
        setMessage(
          "El pago se recibió en PayPal, pero no se pudo verificar en el servidor. Contacta soporte con el ID: " +
            paypalOrderId
        );
        return;
      }

      if (data?.error) {
        setMessage(data.error);
        return;
      }

      const order = data?.orders?.[0];
      if (order) {
        await notifyOrder({ type: "INSERT", record: order });
        onOrderCreated?.(order);
      }

      setShowPayPal(false);
      setMessage(
        data?.duplicate
          ? "Este pago ya estaba registrado."
          : "Pago verificado. Pedido creado correctamente."
      );
    } catch (err) {
      console.error(err);
      setMessage("Error al confirmar el pago con el servidor.");
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
            style={{
              width: "100%",
              borderRadius: 16,
              maxHeight: 420,
              objectFit: "cover",
            }}
          />
        </div>

        <div>
          <span className="category-pill">{product.category || "Producto"}</span>
          {product.is_featured && (
            <span
              className="category-pill"
              style={{ background: "#f59e0b", color: "#fff", marginLeft: 8 }}
            >
              Destacado
            </span>
          )}

          <h1 style={{ marginTop: 12 }}>{product.title}</h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <Stars value={avgRating} size={18} />
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              {reviews.length > 0
                ? `${avgRating.toFixed(1)} · ${reviews.length} reseña${reviews.length === 1 ? "" : "s"}`
                : "Sin reseñas todavía"}
            </span>
          </div>

          <div style={{ fontSize: 32, fontWeight: 700, margin: "12px 0" }}>
            ${product.price}
          </div>

          <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            {product.description || "Sin descripción."}
          </p>

          <div style={{ marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
            {product.product_type === "digital" && "Descarga digital inmediata"}
            {product.product_type === "physical" &&
              `Envío disponible · Stock: ${product.stock ?? "—"}`}
            {product.product_type === "both" && "Digital y físico"}
          </div>

          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>Cantidad:</span>
            <button
              className="button outline small"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={showPayPal || buying}
            >
              −
            </button>
            <span style={{ minWidth: 28, textAlign: "center", fontWeight: 600 }}>{qty}</span>
            <button
              className="button outline small"
              onClick={() => setQty((q) => q + 1)}
              disabled={showPayPal || buying}
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
                  alert(
                    `${qty} producto${qty > 1 ? "s" : ""} añadido${qty > 1 ? "s" : ""} al carrito`
                  );
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
              {buying ? (
                <p style={{ color: "var(--muted)" }}>Verificando pago en el servidor...</p>
              ) : (
                <PayPalCheckout
                  amount={total}
                  description={`${product.title} x${qty}`}
                  onPaid={handlePaid}
                  onError={() => setMessage("Error en el pago. Inténtalo de nuevo.")}
                />
              )}
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
                  message.includes("verificado") ||
                  message.includes("correctamente") ||
                  message.includes("registrado")
                    ? "#16a34a"
                    : "#dc2626",
              }}
            >
              {message}
            </p>
          )}

          <p style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
            Después de recibir el producto, podrás calificarlo con estrellas en{" "}
            <strong>Mis pedidos</strong>.
          </p>
        </div>
      </div>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 20, marginBottom: 14 }}>Reseñas de compradores</h2>
        {reviews.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Aún no hay reseñas para este producto.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {reviews.map((r) => (
              <article
                key={r.id}
                className="service-card"
                style={{ padding: "14px 16px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <Stars value={r.rating} size={16} />
                  <small style={{ color: "var(--muted)" }}>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString("es-ES")
                      : ""}
                  </small>
                </div>
                {r.comment && (
                  <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
                    {r.comment}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
