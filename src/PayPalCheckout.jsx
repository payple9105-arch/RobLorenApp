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

function PayPalCheckout({ amount, description, onPaid }) {
  const host = useRef(null);
  const paid = useRef(onPaid);
  paid.current = onPaid;

  useEffect(() => {
    let alive = true;

    loadPayPal()
      .then((paypal) => {
        if (!alive || !host.current || !paypal) return;
        host.current.innerHTML = "";

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
              alert("No se pudo completar el pago. Inténtalo de nuevo.");
            }
          },
          onError: () => {
            alert("Ocurrió un error con el pago. Inténtalo de nuevo.");
          },
        };

        // Botón PayPal
        const paypalBtn = paypal.Buttons({
          ...orderConfig,
          fundingSource: paypal.FUNDING.PAYPAL,
          style: { shape: "rect", color: "gold", label: "paypal", height: 48 },
        });

        // Botón Tarjeta (Visa / Mastercard)
        const cardBtn = paypal.Buttons({
          ...orderConfig,
          fundingSource: paypal.FUNDING.CARD,
          style: { shape: "rect", color: "black", label: "pay", height: 48 },
        });

        const renders = [];
        if (paypalBtn.isEligible()) renders.push(paypalBtn.render(host.current));
        if (cardBtn.isEligible()) renders.push(cardBtn.render(host.current));

        return Promise.all(renders);
      })
      .catch(() => {
        if (host.current) {
          host.current.textContent = "No se pudo cargar PayPal. Recarga la página.";
        }
      });

    return () => {
      alive = false;
    };
  }, [amount, description]);

  return (
    <div className="paypal-slot" ref={host} style={{ minHeight: 110, display: "grid", gap: 10 }} />
  );
}
