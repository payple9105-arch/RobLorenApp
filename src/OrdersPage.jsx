import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function OrdersPage({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("buyer");
  const [updating, setUpdating] = useState(null);
  const [trackingInput, setTrackingInput] = useState({});

  useEffect(() => {
    if (!user?.id) return;
    loadOrders();
  }, [user, tab]);

  const loadOrders = async () => {
    setLoading(true);

    const column = tab === "buyer" ? "buyer_id" : "seller_id";

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq(column, user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }

    setLoading(false);
  };

  const markAsReceived = async (orderId) => {
    setUpdating(orderId);

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

    setUpdating(null);
    alert("Pedido marcado como recibido. El pago se ha liberado al vendedor (menos la comisión de RobLoren).");
  };

  const saveTracking = async (orderId) => {
    const tracking = trackingInput[orderId]?.trim();
    if (!tracking) return;

    setUpdating(orderId);

    const { error } = await supabase
      .from("orders")
      .update({ tracking_number: tracking })
      .eq("id", orderId)
      .eq("seller_id", user.id);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, tracking_number: tracking } : o))
      );
      setTrackingInput((prev) => ({ ...prev, [orderId]: "" }));
    }

    setUpdating(null);
  };

  const statusLabel = (status) => {
    const map = {
      pending: "Pendiente de confirmación",
      paid: "Pagado (en retención)",
      completed: "Recibido — pago liberado",
    };
    return map[status] || status || "Pendiente";
  };

  if (!user) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>Inicia sesión para ver tus pedidos.</p>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>${Number(order.total || order.amount || 0).toFixed(2)}</strong>
                <span className="category-pill">{statusLabel(order.status)}</span>
              </div>
              <p style={{ margin: "8px 0 4px", fontSize: 14, color: "var(--muted)" }}>
                Pedido #{order.id?.slice(0, 8)}
              </p>
              <small style={{ color: "var(--muted)" }}>
                {new Date(order.created_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </small>

              {order.tracking_number && (
                <p style={{ marginTop: 8, fontSize: 13 }}>
                  <strong>Tracking:</strong> {order.tracking_number}
                </p>
              )}

              {tab === "buyer" && order.status !== "completed" && (
                <button
                  className="button outline small"
                  style={{ marginTop: 12 }}
                  disabled={updating === order.id}
                  onClick={() => markAsReceived(order.id)}
                >
                  {updating === order.id ? "Actualizando..." : "Marcar como recibido"}
                </button>
              )}

              {tab === "seller" && order.status !== "completed" && (
                <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Número de tracking"
                    value={trackingInput[order.id] || ""}
                    onChange={(e) =>
                      setTrackingInput((prev) => ({ ...prev, [order.id]: e.target.value }))
                    }
                    style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
                  />
                  <button
                    className="button outline small"
                    disabled={updating === order.id || !trackingInput[order.id]?.trim()}
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

              {tab === "seller" && order.status !== "completed" && !order.tracking_number && (
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
