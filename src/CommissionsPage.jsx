import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function CommissionsPage({ user }) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCommission, setTotalCommission] = useState(0);
  const [totalNet, setTotalNet] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("commissions")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCommissions(data);
        const commissionSum = data.reduce((acc, c) => acc + Number(c.commission_amount || 0), 0);
        const netSum = data.reduce((acc, c) => acc + (Number(c.amount || 0) - Number(c.commission_amount || 0)), 0);
        setTotalCommission(commissionSum);
        setTotalNet(netSum);
      }

      setLoading(false);
    };

    load();
  }, [user]);

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
        <p>Aquí puedes ver las comisiones generadas por tus ventas.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="service-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>Comisión (RobLoren)</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: "#dc2626" }}>
            ${totalCommission.toFixed(2)}
          </div>
        </div>
        <div className="service-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--muted)" }}>Te queda</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: "#16a34a" }}>
            ${totalNet.toFixed(2)}
          </div>
        </div>
      </div>

      {commissions.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)" }}>
          Aún no tienes comisiones registradas.
        </p>
      ) : (
        <div className="requests-grid">
          {commissions.map((c) => (
            <article key={c.id} className="request-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Comisión</div>
                  <strong style={{ color: "#dc2626" }}>${Number(c.commission_amount).toFixed(2)}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Te queda</div>
                  <strong style={{ color: "#16a34a" }}>
                    ${(Number(c.amount) - Number(c.commission_amount)).toFixed(2)}
                  </strong>
                </div>
              </div>
              <p style={{ margin: "8px 0 4px", fontSize: 14 }}>
                Venta: ${Number(c.amount).toFixed(2)} · {c.commission_rate}%
              </p>
              <small style={{ color: "var(--muted)" }}>
                {new Date(c.created_at).toLocaleDateString("es-ES", {
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
