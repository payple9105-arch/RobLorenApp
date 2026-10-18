import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

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
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export default function CartPage({ user, onBack }) {
  const [cart, setCart] = useState([]);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCart(getCart());
  }, []);

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.qty || 1), 0);

  const handleRemove = (id) => {
    setCart(removeFromCart(id));
  };

  const checkout = async () => {
    if (!user) {
      setMessage("Debes iniciar sesión para comprar.");
      return;
    }
    if (cart.length === 0) return;

    setBuying(true);
    setMessage("");

    try {
      for (const item of cart) {
        if (!item.seller_id) continue;

        const { error } = await supabase.from("orders").insert({
          buyer_id: user.id,
          seller_id: item.seller_id,
          product_id: item.id,
          amount: Number(item.price) * (item.qty || 1),
          total: Number(item.price) * (item.qty || 1),
          status: "pending",
        });

        if (error) throw error;
      }

      clearCart();
      setCart([]);
      setMessage("Pedido creado correctamente. Las comisiones se registraron.");
    } catch (err) {
      console.error(err);
      setMessage("No se pudo completar la compra. Inténtalo de nuevo.");
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
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: 14, color: "var(--muted)" }}>
                      ${item.price} × {item.qty || 1}
                    </div>
                  </div>
                  <button
                    className="button outline small"
                    onClick={() => handleRemove(item.id)}
                  >
                    Quitar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="service-card" style={{ marginTop: 24, textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
              Total: ${total.toFixed(2)}
            </div>
            <button
              className="button primary large"
              style={{ width: "100%", maxWidth: 320 }}
              disabled={buying}
              onClick={checkout}
            >
              {buying ? "Procesando..." : "Comprar ahora"}
            </button>
          </div>
        </>
      )}

      {message && (
        <p style={{ marginTop: 16, color: message.includes("correctamente") ? "#16a34a" : "#dc2626" }}>
          {message}
        </p>
      )}
    </main>
  );
}
