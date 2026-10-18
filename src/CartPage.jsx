import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import PayPalCheckout from "./PayPalCheckout";
import { notifyOrder } from "./notify";

const CART_KEY = "robloren-cart";

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  const addQty = Number(product.qty) || 1;

  if (existing) {
    existing.qty = (existing.qty || 1) + addQty;
  } else {
    cart.push({ ...product, qty: addQty });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function updateQty(productId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (item) {
    item.qty = Math.max(1, qty);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  return getCart();
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export default function CartPage({ user, onBack }) {
  const [cart, setCart] = useState([]);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");
  const [showPayPal, setShowPayPal] = useState(false);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.qty || 1), 0);

  const handleQty = (id, delta) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(1, (item.qty || 1) + delta);
    setCart(updateQty(id, newQty));
  };

  const handleRemove = (id) => {
    setCart(removeFromCart(id));
  };

  const startCheckout = () => {
    if (!user) {
      setMessage("Debes iniciar sesión para comprar.");
      return;
    }
    if (cart.length === 0) return;
    setShowPayPal(true);
    setMessage("");
  };

  const handlePaid = async (details) => {
    setBuying(true);
    setMessage("");

    try {
      const createdOrders = [];

      for (const item of cart) {
        if (!item.seller_id) continue;

        const qty = item.qty || 1;
        const itemTotal = Number(item.price) * qty;

        const { data, error } = await supabase.from("orders").insert({
          buyer_id: user.id,
          seller_id: item.seller_id,
          product_id: item.id,
          amount: itemTotal,
          total: itemTotal,
          status: "paid",
          paypal_order_id: details?.id || null,
        }).select().single();

        if (error) throw error;

        if (data) createdOrders.push(data);

        if (item.stock !== null && item.stock !== undefined) {
          await supabase
            .from("products")
            .update({ stock: Math.max(0, (item.stock || 0) - qty) })
            .eq("id", item.id);
        }
      }

      for (const order of createdOrders) {
        await notifyOrder({
          type: "INSERT",
          record: order,
        });
      }

      clearCart();
      setCart([]);
      setShowPayPal(false);
      setMessage("Pago completado. Pedidos creados correctamente.");
    } catch (err) {
      console.error(err);
      setMessage("Pago recibido, pero hubo un error al guardar los pedidos.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <main className="page-container">
      <button className="button outline" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Volver
      </button>

      <header className="page-header">
        <span className="eyebrow">COMPRAS</span>
        <h1>Carrito</h1>
      </header>

      {cart.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)", marginTop: 40 }}>
          Tu carrito está vacío.
        </p>
      ) : (
        <>
          <div className="requests-grid">
            {cart.map((item) => (
              <article key={item.id} className="request-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: 14, color: "var(--muted)" }}>
                      ${item.price} c/u
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      className="button outline small"
                      onClick={() => handleQty(item.id, -1)}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 24, textAlign: "center" }}>{item.qty || 1}</span>
                    <button
                      className="button outline small"
                      onClick={() => handleQty(item.id, 1)}
                    >
                      +
                    </button>
                    <button
                      className="button outline small"
                      onClick={() => handleRemove(item.id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="service-card" style={{ marginTop: 24, textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
              Total: ${total.toFixed(2)}
            </div>

            {!showPayPal ? (
              <button
                className="button primary large"
                style={{ width: "100%", maxWidth: 320 }}
                disabled={buying}
                onClick={startCheckout}
              >
                {buying ? "Procesando..." : "Pagar con PayPal"}
              </button>
            ) : (
              <div style={{ maxWidth: 400, margin: "0 auto" }}>
                <PayPalCheckout
                  amount={total}
                  description={`Carrito RobLoren (${cart.length} productos)`}
                  onPaid={handlePaid}
                  onError={() => setMessage("Error en el pago. Inténtalo de nuevo.")}
                />
              </div>
            )}
          </div>
        </>
      )}

      {message && (
        <p style={{ marginTop: 16, color: message.includes("completado") || message.includes("correctamente") ? "#16a34a" : "#dc2626" }}>
          {message}
        </p>
      )}
    </main>
  );
}
