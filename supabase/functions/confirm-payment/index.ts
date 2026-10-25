import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function money(value: number) {
  return (Math.round(Number(value || 0) * 100) / 100).toFixed(2);
}

async function getPayPalAccessToken() {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
  const base = Deno.env.get("PAYPAL_API_BASE") || "https://api-m.paypal.com";

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return { token: data.access_token as string, base };
}

async function fetchPayPalOrder(orderId: string) {
  const { token, base } = await getPayPalAccessToken();
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `PayPal order lookup failed: ${res.status} ${JSON.stringify(data)}`
    );
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const paypalOrderId = String(body?.paypal_order_id || "").trim();
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!paypalOrderId) {
      return new Response(JSON.stringify({ error: "Falta paypal_order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (items.length === 0) {
      return new Response(JSON.stringify({ error: "No hay productos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Idempotencia: no procesar dos veces el mismo pago PayPal
    const { data: existing } = await admin
      .from("orders")
      .select("id, status, total")
      .eq("paypal_order_id", paypalOrderId);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Pedido ya registrado",
          orders: existing,
          duplicate: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar pago real en PayPal
    const paypalOrder = await fetchPayPalOrder(paypalOrderId);
    const status = String(paypalOrder?.status || "");

    if (status !== "COMPLETED" && status !== "APPROVED") {
      return new Response(
        JSON.stringify({
          error: "El pago de PayPal no está completado",
          paypal_status: status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const capture =
      paypalOrder?.purchase_units?.[0]?.payments?.captures?.[0] ||
      paypalOrder?.purchase_units?.[0];

    const paidValue = Number(
      capture?.amount?.value ||
        paypalOrder?.purchase_units?.[0]?.amount?.value ||
        0
    );
    const paidCurrency = String(
      capture?.amount?.currency_code ||
        paypalOrder?.purchase_units?.[0]?.amount?.currency_code ||
        "USD"
    );

    if (paidCurrency !== "USD") {
      return new Response(
        JSON.stringify({ error: "Moneda no soportada", paidCurrency }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar productos y recalcular total en servidor
    let expectedTotal = 0;
    const prepared: Array<{
      product_id: string;
      seller_id: string;
      qty: number;
      unit_price: number;
      line_total: number;
      stock: number | null;
      title: string;
    }> = [];

    for (const raw of items) {
      const productId = String(raw?.product_id || raw?.id || "");
      const qty = Math.max(1, Number(raw?.qty || 1));
      if (!productId) continue;

      const { data: product, error: productError } = await admin
        .from("products")
        .select("id, seller_id, price, stock, title")
        .eq("id", productId)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: `Producto no encontrado: ${productId}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!product.seller_id) {
        return new Response(
          JSON.stringify({ error: `Producto sin vendedor: ${productId}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (product.stock !== null && product.stock !== undefined) {
        if (Number(product.stock) < qty) {
          return new Response(
            JSON.stringify({
              error: `Stock insuficiente para ${product.title}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      const unit = Number(product.price || 0);
      const line = unit * qty;
      expectedTotal += line;

      prepared.push({
        product_id: product.id,
        seller_id: product.seller_id,
        qty,
        unit_price: unit,
        line_total: line,
        stock:
          product.stock === null || product.stock === undefined
            ? null
            : Number(product.stock),
        title: product.title || "Producto",
      });
    }

    if (prepared.length === 0) {
      return new Response(JSON.stringify({ error: "Ningún producto válido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expected = Number(money(expectedTotal));
    const paid = Number(money(paidValue));

    // Tolerancia de 0.05 USD por redondeos
    if (Math.abs(expected - paid) > 0.05) {
      return new Response(
        JSON.stringify({
          error: "El importe de PayPal no coincide con el carrito",
          expected,
          paid,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Comisión por defecto 15% (ajustable por plan más adelante)
    const defaultRate = 15;
    const createdOrders = [];

    for (const line of prepared) {
      const commissionAmount =
        Math.round(line.line_total * (defaultRate / 100) * 100) / 100;

      const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
          buyer_id: user.id,
          seller_id: line.seller_id,
          product_id: line.product_id,
          amount: line.line_total,
          total: line.line_total,
          status: "paid",
          paypal_order_id: paypalOrderId,
        })
        .select()
        .single();

      if (orderError) {
        // Posible carrera de idempotencia
        if (String(orderError.message || "").includes("duplicate")) {
          continue;
        }
        throw orderError;
      }

      createdOrders.push(order);

      // Comisión
      await admin.from("commissions").insert({
        order_id: order.id,
        seller_id: line.seller_id,
        amount: line.line_total,
        commission_amount: commissionAmount,
        commission_rate: defaultRate,
        status: "pending",
      });

      // Stock
      if (line.stock !== null) {
        await admin
          .from("products")
          .update({ stock: Math.max(0, line.stock - line.qty) })
          .eq("id", line.product_id);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        orders: createdOrders,
        paypal_status: status,
        paid,
        expected,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Error interno",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
