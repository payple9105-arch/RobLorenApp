import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function OrdersPage({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("buyer"); // "buyer" | "seller"

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
                <span className="category-pill">{order.status || "pending"}</span>
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
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
