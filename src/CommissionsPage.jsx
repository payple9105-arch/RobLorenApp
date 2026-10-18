import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function CommissionsPage({ user }) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(0);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    load();
  }, [user]);

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("commissions")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCommissions(data);

      const availableSum = data
        .filter((c) => c.status === "released")
        .reduce((acc, c) => acc + (Number(c.amount || 0) - Number(c.commission_amount || 0)), 0);

      const pendingSum = data
        .filter((c) => c.status !== "released")
        .reduce((acc, c) => acc + (Number(c.amount || 0) - Number(c.commission_amount || 0)), 0);

      setAvailable(availableSum);
      setPending(pendingSum);
    }

    setLoading(false);
  };

  const requestPayout = async () => {
    if (available <= 0) return;
    const confirm = window.confirm(
      `¿Solicitar el retiro de $${available.toFixed(2)}?\n\n(Por ahora se marcará como solicitado. El pago real se activará cuando conectemos PayPal Payouts.)`
    );
    if (!confirm) return;

    const { error } = await supabase
      .from("commissions")
      .update({ status: "payout_requested" })
      .eq("seller_id", user.id)
      .eq("status", "released");

    if (!error) {
      alert("Solicitud de retiro registrada. Te avisaremos cuando se procese el pago.");
      load();
    } else {
      alert("No se pudo registrar la solicitud.");
    }
  };

  if (!user) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>Inicia sesión para ver tus comisiones.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>Cargando comisiones...</p>
      </main>
    );
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <span className="eyebrow">PROFESIONAL</span>
        <h1>Mis comisiones</h1>
        <p>El dinero se libera cuando el comprador confirma que recibió el producto.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="service-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>Disponible para retirar</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: "#16a34a" }}>
            ${available.toFixed(2)}
          </div>
          {available > 0 && (
            <button
              className="button primary"
              style={{ marginTop: 12 }}
              onClick={requestPayout}
            >
              Solicitar retiro
            </button>
          )}
        </div>
        <div className="service-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>Pendiente de confirmación</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: "#f59e0b" }}>
            ${pending.toFixed(2)}
          </div>
        </div>
      </div>

      {commissions.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)" }}>
          Aún no tienes comisiones registradas.
        </p>
      ) : (
        <div className="requests-grid">
          {commissions.map((c) => {
            const net = Number(c.amount || 0) - Number(c.commission_amount || 0);
            const statusMap = {
              released: { label: "Disponible", color: "#16a34a" },
              payout_requested: { label: "Retiro solicitado", color: "#2563eb" },
              pending: { label: "Pendiente", color: "#f59e0b" },
            };
            const st = statusMap[c.status] || statusMap.pending;

            return (
              <article key={c.id} className="request-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Te queda</div>
                    <strong style={{ color: "#16a34a" }}>${net.toFixed(2)}</strong>
                  </div>
                  <span className="category-pill" style={{ background: st.color, color: "#fff" }}>
                    {st.label}
                  </span>
                </div>
                <p style={{ margin: "8px 0 4px", fontSize: 14 }}>
                  Venta: ${Number(c.amount).toFixed(2)} · Comisión {c.commission_rate}%
                </p>
                <small style={{ color: "var(--muted)" }}>
                  {new Date(c.created_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </small>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
