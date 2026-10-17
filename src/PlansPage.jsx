import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function PlansPage({ user, onPlanChanged }) {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: plansData } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      setPlans(plansData || []);

      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan_id")
          .eq("id", user.id)
          .maybeSingle();

        setCurrentPlan(profile?.plan_id || "free");
      }

      setLoading(false);
    };

    load();
  }, [user]);

  const selectPlan = async (planId) => {
    if (!user?.id || planId === currentPlan) return;

    setUpdating(true);

    const { error } = await supabase
      .from("profiles")
      .update({ plan_id: planId })
      .eq("id", user.id);

    setUpdating(false);

    if (!error) {
      setCurrentPlan(planId);
      onPlanChanged?.(planId);
      alert("Plan actualizado correctamente");
    } else {
      alert("No se pudo actualizar el plan");
    }
  };

  if (loading) {
    return (
      <main className="page-container">
        <p style={{ textAlign: "center", marginTop: 40 }}>Cargando planes...</p>
      </main>
    );
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <span className="eyebrow">PROFESIONALES</span>
        <h1>Elige tu plan</h1>
        <p>Menor comisión y más productos según el plan que elijas.</p>
      </header>

      <div className="services-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <article
              key={plan.id}
              className="service-card"
              style={{
                border: isCurrent ? "2px solid #2563eb" : undefined,
                position: "relative",
              }}
            >
              {isCurrent && (
                <span
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "#2563eb",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                  }}
                >
                  Actual
                </span>
              )}

              <h3 style={{ marginTop: 8 }}>{plan.name}</h3>
              <div style={{ fontSize: 28, fontWeight: 700, margin: "8px 0" }}>
                ${plan.price}
                <span style={{ fontSize: 14, fontWeight: 400, color: "var(--muted)" }}>
                  {plan.id === "weekly" ? "/semana" : plan.id === "annual" ? "/año" : "/mes"}
                </span>
              </div>

              <p style={{ color: "var(--muted)", marginBottom: 12 }}>
                Comisión: <strong>{plan.commission_rate}%</strong>
              </p>

              <ul style={{ paddingLeft: 18, margin: "12px 0 20px", fontSize: 14 }}>
                {(plan.features || []).map((f) => (
                  <li key={f}>{f}</li>
                ))}
                <li>Hasta {plan.max_products === 999 ? "ilimitados" : plan.max_products} productos</li>
              </ul>

              <button
                className={isCurrent ? "button outline" : "button primary"}
                disabled={isCurrent || updating}
                onClick={() => selectPlan(plan.id)}
                style={{ width: "100%" }}
              >
                {isCurrent ? "Plan actual" : updating ? "Actualizando..." : "Elegir plan"}
              </button>
            </article>
          );
        })}
      </div>

      <p style={{ textAlign: "center", marginTop: 32, color: "var(--muted)", fontSize: 13 }}>
        El pago de los planes se activará cuando conectemos el sistema de cobros.
        Por ahora puedes cambiar de plan libremente para probar.
      </p>
    </main>
  );
}
