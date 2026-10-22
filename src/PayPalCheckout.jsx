function loadPayPal() {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (window.__roblorenPayPal) return window.__roblorenPayPal;

  window.__roblorenPayPal = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=card,paylater,venmo`;
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

        // Limpiar contenedor
        host.current.innerHTML = "";

        // Crear contenedor visual
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "display:grid;gap:12px;width:100%;";

        // Título
        const title = document.createElement("div");
        title.style.cssText = "font-size:14px;font-weight:600;color:#101828;margin-bottom:4px;";
        title.textContent = "Elige cómo pagar";
        wrapper.appendChild(title);

        // Contenedor para botón PayPal
        const paypalContainer = document.createElement("div");
        paypalContainer.id = "paypal-btn-container";
        wrapper.appendChild(paypalContainer);

        // Separador
        const separator = document.createElement("div");
        separator.style.cssText = "display:flex;align-items:center;gap:10px;color:#5d6b80;font-size:13px;";
        separator.innerHTML = `<div style="flex:1;height:1px;background:#e6ebf2;"></div><span>o</span><div style="flex:1;height:1px;background:#e6ebf2;"></div>`;
        wrapper.appendChild(separator);

        // Contenedor para botón de tarjeta
        const cardContainer = document.createElement("div");
        cardContainer.id = "card-btn-container";
        wrapper.appendChild(cardContainer);

        // Nota de tarjetas
        const note = document.createElement("div");
        note.style.cssText = "font-size:12px;color:#5d6b80;text-align:center;margin-top:4px;";
        note.textContent = "Visa • Mastercard • Amex • Discover";
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
              alert("No se pudo completar el pago. Inténtalo de nuevo.");
            }
          },
          onError: (err) => {
            console.error(err);
            alert("Ocurrió un error con el pago. Inténtalo de nuevo.");
          },
          onCancel: () => {
            // El usuario cerró la ventana, no hacemos nada
          },
        };

        // Botón de PayPal
        const paypalButton = paypal.Buttons({
          ...orderConfig,
          fundingSource: paypal.FUNDING.PAYPAL,
          style: {
            shape: "rect",
            color: "gold",
            label: "paypal",
            height: 48,
          },
        });

        // Botón de Tarjeta (Visa / Mastercard)
        const cardButton = paypal.Buttons({
          ...orderConfig,
          fundingSource: paypal.FUNDING.CARD,
          style: {
            shape: "rect",
            color: "black",
            label: "pay",
            height: 48,
          },
        });

        const renders = [];

        if (paypalButton.isEligible()) {
          renders.push(paypalButton.render("#paypal-btn-container"));
        }

        if (cardButton.isEligible()) {
          renders.push(cardButton.render("#card-btn-container"));
        } else {
          // Si no es elegible, mostramos un mensaje
          cardContainer.innerHTML = `
            <div style="padding:12px;background:#f5f7fb;border-radius:10px;text-align:center;font-size:13px;color:#5d6b80;">
              El pago con tarjeta estará disponible pronto
            </div>
          `;
        }

        return Promise.all(renders);
      })
      .catch(() => {
        if (host.current) {
          host.current.innerHTML = `
            <div style="padding:16px;background:#fff0f3;border-radius:12px;color:#d3456a;font-size:14px;text-align:center;">
              No se pudo cargar PayPal. Recarga la página e inténtalo de nuevo.
            </div>
          `;
        }
      });

    return () => {
      alive = false;
    };
  }, [amount, description]);

  return <div className="paypal-slot" ref={host} style={{ minHeight: 140 }} />;
}
