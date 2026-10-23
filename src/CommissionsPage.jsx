import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function CommissionsPage({ user }) {
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(0);
  const [pending, setPending] = useState(0);
  const [requested, setRequested] = useState(0);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    load();
  }, [user]);

  const netOf = (c) =>
    Number(c.amount || 0) - Number(c.commission_amount || c.platform_fee || 0);

  const load = async () => {
    setLoading(true);

    const [{ data: commData }, { data: payoutData }] = await Promise.all([
      supabase
        .from("commissions")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payout_requests")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const list = commData || [];
    setCommissions(list);
    setPayouts(payoutData || []);

    const availableSum = list
      .filter((c) => c.status === "released")
      .reduce((acc, c) => acc + netOf(c), 0);

    const pendingSum = list
      .filter((c) => c.status === "pending" || !c.status)
      .reduce((acc, c) => acc + netOf(c), 0);

    const requestedSum = list
      .filter((c) => c.status === "payout_requested")
      .reduce((acc, c) => acc + netOf(c), 0);

    setAvailable(availableSum);
    setPending(pendingSum);
    setRequested(requestedSum);

    if (user.email) setPaypalEmail((prev) => prev || user.email);

    setLoading(false);
  };

  const requestPayout = async () => {
    if (available <= 0.01) {
      alert("No tienes saldo disponible para retirar.");
      return;
    }

    const email = paypalEmail.trim();
    if (!email || !email.includes("@")) {
      alert("Escribe un correo de PayPal válido.");
      return;
    }

    const ok = window.confirm(
      `¿Solicitar retiro de $${available.toFixed(2)} a ${email}?\n\nSe intentará enviar el dinero automáticamente por PayPal.`
    );
    if (!ok) return;

    setSubmitting(true);

    try {
      const released = commissions.filter((c) => c.status === "released");
      const commissionIds = released.map((c) => c.id);

      const { data: payout, error: payoutError } = await supabase
        .from("payout_requests")
        .insert({
          seller_id: user.id,
          amount: available,
          paypal_email: email,
          status: "pending",
          commission_ids: commissionIds,
        })
        .select()
        .single();

      if (payoutError) {
        alert(
          "No se pudo crear la solicitud. Ejecuta el SQL de payouts en Supabase.\n" +
            payoutError.message
        );
        return;
      }

      await supabase
        .from("commissions")
        .update({ status: "payout_requested" })
        .eq("seller_id", user.id)
        .eq("status", "released");

      // Intento de pago automático vía Edge Function
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "process-payout",
        { body: { payout_id: payout.id } }
      );

      if (fnError) {
        console.error(fnError);
        alert(
          "Solicitud creada, pero el pago automático aún no está configurado o falló.\n" +
            "Revisa los secrets de Supabase y que Payouts esté activo en PayPal.\n" +
            (fnError.message || "")
        );
      } else if (fnData?.error) {
        alert(
          "Solicitud creada. PayPal respondió: " +
            (fnData.error || "error") +
            "\nPuedes procesarla manualmente si hace falta."
        );
      } else {
        alert(
          "¡Retiro enviado! PayPal está procesando el pago a " +
            email +
            "."
        );
      }

      setShowForm(false);
      await load();
    } catch (err) {
      console.error(err);
      alert("Error al solicitar el retiro.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusMap = {
    released: { label: "Disponible", color: "#16a34a" },
    payout_requested: { label: "En retiro", color: "#2563eb" },
    paid: { label: "Pagado", color: "#64748b" },
    pending: { label: "Pendiente", color: "#f59e0b" },
  };

  const payoutStatusMap = {
    pending: { label: "Pendiente de pago", color: "#f59e0b" },
    processing: { label: "Procesando", color: "#2563eb" },
    paid: { label: "Pagado", color: "#16a34a" },
    rejected: { label: "Rechazado", color: "#dc2626" },
  };

  if (!user) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>
          Inicia sesión para ver tus comisiones.
        </p>
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
        <h1>Ganancias y retiros</h1>
        <p>
          El dinero se libera cuando el comprador confirma la recepción. Luego puedes
          solicitar el retiro a tu PayPal (pago automático si está configurado).
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="service-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Disponible</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: "#16a34a" }}>
            ${available.toFixed(2)}
          </div>
        </div>
        <div className="service-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>En retiro</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: "#2563eb" }}>
            ${requested.toFixed(2)}
          </div>
        </div>
        <div className="service-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Pendiente</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: "#f59e0b" }}>
            ${pending.toFixed(2)}
          </div>
        </div>
      </div>

      {available > 0.01 && (
        <div className="service-card" style={{ marginBottom: 24 }}>
          {!showForm ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ marginBottom: 12, color: "var(--muted)", fontSize: 14 }}>
                Puedes retirar <strong>${available.toFixed(2)}</strong> a tu cuenta PayPal.
              </p>
              <button className="button primary" onClick={() => setShowForm(true)}>
                Solicitar retiro
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12, maxWidth: 420, margin: "0 auto" }}>
              <label style={{ fontSize: 14, fontWeight: 600 }}>
                Correo de PayPal donde quieres recibir el dinero
              </label>
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #e6ebf2",
                  font: "inherit",
                }}
              />
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                Monto a retirar: <strong>${available.toFixed(2)}</strong>
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="button primary"
                  disabled={submitting}
                  onClick={requestPayout}
                >
                  {submitting ? "Procesando..." : "Confirmar retiro automático"}
                </button>
                <button
                  className="button outline"
                  disabled={submitting}
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {payouts.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Historial de retiros</h2>
          <div className="requests-grid" style={{ marginBottom: 28 }}>
            {payouts.map((p) => {
              const st = payoutStatusMap[p.status] || payoutStatusMap.pending;
              return (
                <article key={p.id} className="request-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>${Number(p.amount || 0).toFixed(2)}</strong>
                    <span
                      className="category-pill"
                      style={{ background: st.color, color: "#fff" }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 4px", fontSize: 14, color: "var(--muted)" }}>
                    PayPal: {p.paypal_email}
                  </p>
                  <small style={{ color: "var(--muted)" }}>
                    {new Date(p.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </small>
                </article>
              );
            })}
          </div>
        </>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Detalle de ventas</h2>

      {commissions.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)" }}>
          Aún no tienes comisiones registradas.
        </p>
      ) : (
        <div className="requests-grid">
          {commissions.map((c) => {
            const net = netOf(c);
            const st = statusMap[c.status] || statusMap.pending;

            return (
              <article key={c.id} className="request-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Te queda</div>
                    <strong style={{ color: "#16a34a" }}>${net.toFixed(2)}</strong>
                  </div>
                  <span
                    className="category-pill"
                    style={{ background: st.color, color: "#fff" }}
                  >
                    {st.label}
                  </span>
                </div>
                <p style={{ margin: "8px 0 4px", fontSize: 14 }}>
                  Venta: ${Number(c.amount || 0).toFixed(2)}
                  {c.commission_rate != null && ` · Comisión ${c.commission_rate}%`}
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

      <p
        style={{
          marginTop: 28,
          fontSize: 13,
          color: "var(--muted)",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Si el pago automático está configurado, el dinero se envía al instante a tu PayPal.
        Si falla, la solicitud queda pendiente para procesarla manualmente.
      </p>
    </main>
  );
}
