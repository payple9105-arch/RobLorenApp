import React, { useEffect, useRef } from "react";

const PAYPAL_CLIENT_ID =
  "BAA_Ux_XQQKppjplmdc2V6jZZGOlSQATrlf2UKoc4Pi1lRIbKqtejqk2di8a9hRJ5e0xZFL46K_xfEYt-I";

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
  const err = useRef(onError);
  paid.current = onPaid;
  err.current = onError;

  useEffect(() => {
    let alive = true;

    loadPayPal()
      .then((paypal) => {
        if (!alive || !host.current || !paypal) return;
        host.current.innerHTML = "";

        const order = {
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
            } catch (e) {
              err.current?.(e);
            }
          },
          onError: (e) => {
            err.current?.(e);
            alert("No se pudo completar el pago. Inténtalo de nuevo.");
          },
        };

        const buttons = [
          paypal.Buttons({
            ...order,
            fundingSource: paypal.FUNDING.PAYPAL,
            style: { shape: "rect", color: "gold", label: "paypal" },
          }),
          paypal.Buttons({
            ...order,
            fundingSource: paypal.FUNDING.CARD,
            style: { shape: "rect", color: "black", label: "pay" },
          }),
        ];

        return Promise.all(
          buttons
            .filter((button) => button.isEligible())
            .map((button) => button.render(host.current))
        );
      })
      .catch(() => {
        if (host.current) {
          host.current.textContent = "No se pudo abrir PayPal en este momento.";
        }
      });

    return () => {
      alive = false;
    };
  }, [amount, description]);

  return <div className="paypal-slot" ref={host} />;
}
