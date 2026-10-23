import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { notifyOrder } from "./notify";

export default function OrdersPage({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("buyer");
  const [updating, setUpdating] = useState(null);
  const [trackingInput, setTrackingInput] = useState({});
  const [reviewedOrders, setReviewedOrders] = useState({});
  const [reviewingOrderId, setReviewingOrderId] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    loadOrders();
  }, [user, tab]);

  useEffect(() => {
    if (!user?.id || tab !== "buyer") return;
    loadReviewedOrders();
  }, [user, tab, orders]);

  const loadOrders = async () => {
    setLoading(true);

    const column = tab === "buyer" ? "buyer_id" : "seller_id";

    const { data, error } = await supabase
      .from("orders")
      .select("*, products(title, product_type, digital_file_url)")
      .eq(column, user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }

    setLoading(false);
  };

  const loadReviewedOrders = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("order_id, rating, comment")
      .eq("reviewer_id", user.id)
      .not("order_id", "is", null);

    const map = {};
    (data || []).forEach((r) => {
      if (r.order_id) map[r.order_id] = r;
    });
    setReviewedOrders(map);
  };

  const markAsReceived = async (orderId) => {
    setUpdating(orderId);

    const current = orders.find((o) => o.id === orderId);

    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId)
      .eq("buyer_id", user.id);

    if (orderError) {
      alert("Error al marcar el pedido: " + orderError.message);
      setUpdating(null);
      return;
    }

    await supabase
      .from("commissions")
      .update({ status: "released" })
      .eq("order_id", orderId);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o))
    );

    if (current) {
      await notifyOrder({
        type: "UPDATE",
        record: { ...current, status: "completed" },
        old_record: current,
      });
    }

    setUpdating(null);
    setReviewingOrderId(orderId);
    setReviewRating(0);
    setReviewComment("");
    alert(
      "Pedido marcado como recibido. El pago se ha liberado al vendedor. ¡Puedes dejar una reseña!"
    );
  };

  const submitReview = async (order) => {
    if (!user?.id || !order?.id) return;
    if (reviewRating < 1 || reviewRating > 5) {
      alert("Elige una calificación de 1 a 5 estrellas.");
      return;
    }

    setSavingReview(true);

    try {
      const payload = {
        reviewer_id: user.id,
        reviewed_id: order.seller_id,
        order_id: order.id,
        product_id: order.product_id || null,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      };

      const { data, error } = await supabase
        .from("reviews")
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Si fallan columnas nuevas, intenta sin product_id
        if (error.message?.includes("product_id") || error.message?.includes("order_id")) {
          const { data: data2, error: error2 } = await supabase
            .from("reviews")
            .insert({
              reviewer_id: user.id,
              reviewed_id: order.seller_id,
              rating: reviewRating,
              comment: reviewComment.trim() || null,
              order_id: order.id,
            })
            .select()
            .single();

          if (error2) {
            alert(
              "No se pudo guardar la reseña. Ejecuta el SQL de reseñas en Supabase.\n" +
                error2.message
            );
            return;
          }

          setReviewedOrders((prev) => ({
            ...prev,
            [order.id]: data2 || { rating: reviewRating, comment: reviewComment },
          }));
        } else {
          alert("No se pudo guardar la reseña: " + error.message);
          return;
        }
      } else {
        setReviewedOrders((prev) => ({
          ...prev,
          [order.id]: data || { rating: reviewRating, comment: reviewComment },
        }));
      }

      setReviewingOrderId(null);
      setReviewRating(0);
      setReviewComment("");
      alert("¡Gracias! Tu reseña se publicó correctamente.");
    } catch (err) {
      console.error(err);
      alert("Error al enviar la reseña.");
    } finally {
      setSavingReview(false);
    }
  };

  const openDispute = async (orderId) => {
    const reason = prompt("Describe el problema con este pedido:");
    if (!reason?.trim()) return;

    setUpdating(orderId);

    const current = orders.find((o) => o.id === orderId);

    const { error } = await supabase
      .from("orders")
      .update({ status: "disputed", dispute_reason: reason.trim() })
      .eq("id", orderId)
      .eq("buyer_id", user.id);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "disputed", dispute_reason: reason.trim() }
            : o
        )
      );

      if (current) {
        await notifyOrder({
          type: "UPDATE",
          record: {
            ...current,
            status: "disputed",
            dispute_reason: reason.trim(),
          },
          old_record: current,
        });
      }

      alert("Disputa abierta. El equipo de RobLoren revisará el caso.");
    } else {
      alert("No se pudo abrir la disputa.");
    }

    setUpdating(null);
  };

  const saveTracking = async (orderId) => {
    const trackingUrl = trackingInput[orderId]?.trim();
    if (!trackingUrl) return;

    setUpdating(orderId);

    const current = orders.find((o) => o.id === orderId);

    const { error } = await supabase
      .from("orders")
      .update({ tracking_url: trackingUrl })
      .eq("id", orderId)
      .eq("seller_id", user.id);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, tracking_url: trackingUrl } : o))
      );
      setTrackingInput((prev) => ({ ...prev, [orderId]: "" }));

      if (current) {
        await notifyOrder({
          type: "UPDATE",
          record: { ...current, tracking_url: trackingUrl },
          old_record: current,
        });
      }
    }

    setUpdating(null);
  };

  const statusLabel = (status) => {
    const map = {
      pending: "Pendiente de confirmación",
      paid: "Pagado (en retención)",
      completed: "Recibido — pago liberado",
      disputed: "En disputa",
    };
    return map[status] || status || "Pendiente";
  };

  if (!user) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>
          Inicia sesión para ver tus pedidos.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>Cargando pedidos...</p>
      </main>
    );
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <span className="eyebrow">PEDIDOS</span>
        <h1>Mis pedidos</h1>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>
          El pago se retiene hasta que el comprador confirme que recibió el producto.
          Después puedes dejar una reseña.
        </p>
      </header>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          className={tab === "buyer" ? "button primary" : "button outline"}
          onClick={() => setTab("buyer")}
        >
          Compras
        </button>
        <button
          className={tab === "seller" ? "button primary" : "button outline"}
          onClick={() => setTab("seller")}
        >
          Ventas
        </button>
      </div>

      {orders.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)" }}>
          No tienes {tab === "buyer" ? "compras" : "ventas"} registradas.
        </p>
      ) : (
        <div className="requests-grid">
          {orders.map((order) => (
            <article key={order.id} className="request-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong>${Number(order.total || order.amount || 0).toFixed(2)}</strong>
                <span className="category-pill">{statusLabel(order.status)}</span>
              </div>
              <p style={{ margin: "8px 0 4px", fontSize: 14, color: "var(--muted)" }}>
                Pedido #{order.id?.slice(0, 8)}
                {order.products?.title && ` — ${order.products.title}`}
              </p>
              <small style={{ color: "var(--muted)" }}>
                {new Date(order.created_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </small>

              {order.tracking_url && (
                <p style={{ marginTop: 8, fontSize: 13 }}>
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#2563eb", fontWeight: 600 }}
                  >
                    Ver rastreo del envío
                  </a>
                </p>
              )}

              {tab === "buyer" && order.products?.digital_file_url && (
                <p style={{ marginTop: 8, fontSize: 13 }}>
                  <a
                    href={order.products.digital_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#2563eb", fontWeight: 600 }}
                  >
                    Descargar archivo
                  </a>
                </p>
              )}

              {order.status === "disputed" && order.dispute_reason && (
                <p style={{ marginTop: 8, fontSize: 13, color: "#dc2626" }}>
                  <strong>Disputa:</strong> {order.dispute_reason}
                </p>
              )}

              {tab === "buyer" &&
                order.status !== "completed" &&
                order.status !== "disputed" && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button
                      className="button outline small"
                      disabled={updating === order.id}
                      onClick={() => markAsReceived(order.id)}
                    >
                      {updating === order.id
                        ? "Actualizando..."
                        : "Marcar como recibido"}
                    </button>
                    <button
                      className="button outline small"
                      style={{ color: "#dc2626", borderColor: "#dc2626" }}
                      disabled={updating === order.id}
                      onClick={() => openDispute(order.id)}
                    >
                      Abrir disputa
                    </button>
                  </div>
                )}

              {/* Reseña — solo comprador y pedido completado */}
              {tab === "buyer" && order.status === "completed" && (
                <div style={{ marginTop: 14 }}>
                  {reviewedOrders[order.id] ? (
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "#f0fdf4",
                        borderRadius: 10,
                        fontSize: 13,
                      }}
                    >
                      <strong style={{ color: "#16a34a" }}>
                        Tu reseña: {"★".repeat(reviewedOrders[order.id].rating || 0)}
                        {"☆".repeat(5 - (reviewedOrders[order.id].rating || 0))}
                      </strong>
                      {reviewedOrders[order.id].comment && (
                        <p style={{ marginTop: 4, color: "var(--muted)" }}>
                          {reviewedOrders[order.id].comment}
                        </p>
                      )}
                    </div>
                  ) : reviewingOrderId === order.id ? (
                    <div
                      style={{
                        padding: 12,
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <strong>¿Cómo fue tu experiencia?</strong>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            style={{
                              border: 0,
                              background: "transparent",
                              fontSize: 28,
                              cursor: "pointer",
                              color: star <= reviewRating ? "#f5b400" : "#d1d5db",
                              lineHeight: 1,
                              padding: 0,
                            }}
                            aria-label={`${star} estrellas`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Cuéntanos cómo te fue (opcional)"
                        rows={3}
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid #e6ebf2",
                          resize: "vertical",
                          font: "inherit",
                        }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="button primary small"
                          disabled={savingReview || reviewRating === 0}
                          onClick={() => submitReview(order)}
                        >
                          {savingReview ? "Enviando..." : "Publicar reseña"}
                        </button>
                        <button
                          className="button outline small"
                          disabled={savingReview}
                          onClick={() => {
                            setReviewingOrderId(null);
                            setReviewRating(0);
                            setReviewComment("");
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="button outline small"
                      onClick={() => {
                        setReviewingOrderId(order.id);
                        setReviewRating(0);
                        setReviewComment("");
                      }}
                    >
                      Dejar reseña
                    </button>
                  )}
                </div>
              )}

              {tab === "seller" &&
                order.status !== "completed" &&
                order.status !== "disputed" && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="url"
                      placeholder="Pega aquí el enlace de rastreo"
                      value={trackingInput[order.id] || ""}
                      onChange={(e) =>
                        setTrackingInput((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />
                    <button
                      className="button outline small"
                      disabled={
                        updating === order.id || !trackingInput[order.id]?.trim()
                      }
                      onClick={() => saveTracking(order.id)}
                    >
                      {updating === order.id ? "..." : "Guardar"}
                    </button>
                  </div>
                )}

              {tab === "seller" && order.status === "completed" && (
                <p style={{ marginTop: 12, fontSize: 13, color: "#16a34a" }}>
                  ✓ Pago liberado — listo para cobrar (menos comisión)
                </p>
              )}

              {tab === "seller" && order.status === "disputed" && (
                <p style={{ marginTop: 12, fontSize: 13, color: "#dc2626" }}>
                  Este pedido tiene una disputa abierta
                </p>
              )}

              {tab === "seller" &&
                order.status !== "completed" &&
                order.status !== "disputed" &&
                !order.tracking_url && (
                  <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
                    Esperando confirmación del comprador
                  </p>
                )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
