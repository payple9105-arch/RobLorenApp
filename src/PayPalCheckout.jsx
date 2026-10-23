import React, { useEffect, useRef } from "react";

const PAYPAL_CLIENT_ID =
  "AdE3Rfow5IlmAtfn361m5LsJGr01L4KZo7V6cxJovroYWxwXHIZsh5Ja_01uHMV19DEExovLW8YXsdZN";

function loadPayPal() {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (window.__roblorenPayPal) return window.__roblorenPayPal;

  window.__roblorenPayPal = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=card,paylater`;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error("PayPal no cargó"));
    document.head.appendChild(script);
  });

  return window.__roblorenPayPal;
}

function money(value) {
  return (Math.round(Number(value || 0) * 100) / 100).toFixed(2);
}

export default function PayPalCheckout({ amount, description, onPaid, onError }) {
  const host = useRef(null);
  const paid = useRef(onPaid);
  const errorCb = useRef(onError);
  paid.current = onPaid;
  errorCb.current = onError;

  useEffect(() => {
    let alive = true;

    loadPayPal()
      .then((paypal) => {
        if (!alive || !host.current || !paypal) return;
        host.current.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.style.cssText = "display:grid;gap:14px;width:100%;";

        const title = document.createElement("div");
        title.style.cssText =
          "font-size:15px;font-weight:700;color:#101828;text-align:center;";
        title.textContent = "Elige cómo pagar";
        wrapper.appendChild(title);

        const paypalBox = document.createElement("div");
        paypalBox.style.cssText = "display:grid;gap:6px;";
        const paypalLabel = document.createElement("div");
        paypalLabel.style.cssText =
          "font-size:12px;font-weight:600;color:#5d6b80;text-align:center;";
        paypalLabel.textContent = "PayPal";
        const paypalSlot = document.createElement("div");
        paypalSlot.id = "paypal-btn-slot";
        paypalBox.appendChild(paypalLabel);
        paypalBox.appendChild(paypalSlot);
        wrapper.appendChild(paypalBox);

        const sep = document.createElement("div");
        sep.style.cssText =
          "display:flex;align-items:center;gap:10px;color:#5d6b80;font-size:12px;";
        sep.innerHTML =
          '<div style="flex:1;height:1px;background:#e6ebf2;"></div><span>o</span><div style="flex:1;height:1px;background:#e6ebf2;"></div>';
        wrapper.appendChild(sep);

        const cardBox = document.createElement("div");
        cardBox.style.cssText = "display:grid;gap:6px;";
        const cardLabel = document.createElement("div");
        cardLabel.style.cssText =
          "font-size:12px;font-weight:600;color:#5d6b80;text-align:center;";
        cardLabel.textContent = "Tarjeta (Visa / Mastercard)";
        const cardSlot = document.createElement("div");
        cardSlot.id = "card-btn-slot";
        cardBox.appendChild(cardLabel);
        cardBox.appendChild(cardSlot);
        wrapper.appendChild(cardBox);

        const note = document.createElement("div");
        note.style.cssText =
          "font-size:11px;color:#5d6b80;text-align:center;margin-top:2px;";
        note.textContent = "Pago seguro · Visa · Mastercard · Amex";
        wrapper.appendChild(note);

        host.current.appendChild(wrapper);

        const orderConfig = {
          createOrder: (_data, actions) =>
            actions.order.create({
              purchase_units: [
                {
                  description: description || "Compra en RobLoren",
                  amount: {
                    currency_code: "USD",
                    value: money(amount),
                  },
                },
              ],
            }),
          onApprove: async (_data, actions) => {
            try {
              const details = await actions.order.capture();
              paid.current?.(details);
            } catch (err) {
              console.error(err);
              errorCb.current?.(err);
              alert("No se pudo completar el pago. Inténtalo de nuevo.");
            }
          },
          onError: (err) => {
            console.error(err);
            errorCb.current?.(err);
            alert("Ocurrió un error con el pago. Inténtalo de nuevo.");
          },
        };

        const paypalBtn = paypal.Buttons({
          ...orderConfig,
          fundingSource: paypal.FUNDING.PAYPAL,
          style: { shape: "rect", color: "gold", label: "paypal", height: 48 },
        });

        const cardBtn = paypal.Buttons({
          ...orderConfig,
          fundingSource: paypal.FUNDING.CARD,
          style: { shape: "rect", color: "black", label: "pay", height: 48 },
        });

        const renders = [];

        if (paypalBtn.isEligible()) {
          renders.push(paypalBtn.render("#paypal-btn-slot"));
        } else {
          paypalSlot.innerHTML =
            '<div style="padding:12px;background:#f5f7fb;border-radius:10px;text-align:center;font-size:13px;color:#5d6b80;">PayPal no disponible</div>';
        }

        if (cardBtn.isEligible()) {
          renders.push(cardBtn.render("#card-btn-slot"));
        } else {
          cardSlot.innerHTML =
            '<div style="padding:12px;background:#f5f7fb;border-radius:10px;text-align:center;font-size:13px;color:#5d6b80;">Pago con tarjeta disponible en breve</div>';
        }

        return Promise.all(renders);
      })
      .catch(() => {
        if (host.current) {
          host.current.innerHTML =
            '<div style="padding:16px;background:#fff0f3;border-radius:12px;color:#d3456a;font-size:14px;text-align:center;">No se pudo cargar PayPal. Recarga la página.</div>';
        }
      });

    return () => {
      alive = false;
    };
  }, [amount, description]);

  return (
    <div
      className="paypal-slot"
      ref={host}
      style={{ minHeight: 160, width: "100%" }}
    />
  );
}
