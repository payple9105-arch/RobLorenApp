import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function getPayPalAccessToken() {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
  const base =
    Deno.env.get("PAYPAL_API_BASE") || "https://api-m.paypal.com";

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
    const payoutId = body?.payout_id as string | undefined;

    if (!payoutId) {
      return new Response(JSON.stringify({ error: "Falta payout_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: payout, error: payoutError } = await admin
      .from("payout_requests")
      .select("*")
      .eq("id", payoutId)
      .single();

    if (payoutError || !payout) {
      return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payout.seller_id !== user.id) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payout.status === "paid") {
      return new Response(
        JSON.stringify({ ok: true, message: "Ya estaba pagado" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (payout.status !== "pending" && payout.status !== "processing") {
      return new Response(
        JSON.stringify({ error: `Estado no válido: ${payout.status}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await admin
      .from("payout_requests")
      .update({ status: "processing" })
      .eq("id", payoutId);

    const amount = Number(payout.amount || 0).toFixed(2);
    const { token, base } = await getPayPalAccessToken();

    const batchId = `robloren-${payoutId.slice(0, 8)}-${Date.now()}`;

    const payoutRes = await fetch(`${base}/v1/payments/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": batchId,
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: batchId,
          recipient_type: "EMAIL",
          email_subject: "Has recibido un pago de RobLoren",
          email_message:
            "Tu retiro de ganancias en RobLoren se ha procesado. ¡Gracias por vender en la plataforma!",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: { value: amount, currency: "USD" },
            receiver: payout.paypal_email,
            note: "Retiro de ganancias RobLoren",
            sender_item_id: payoutId,
            recipient_wallet: "PAYPAL",
          },
        ],
      }),
    });

    const payoutJson = await payoutRes.json();

    if (!payoutRes.ok) {
      await admin
        .from("payout_requests")
        .update({
          status: "pending",
          notes: JSON.stringify(payoutJson).slice(0, 500),
        })
        .eq("id", payoutId);

      return new Response(
        JSON.stringify({
          error: "PayPal rechazó el payout",
          details: payoutJson,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const batchStatus = payoutJson?.batch_header?.batch_status;
    const paypalBatchId = payoutJson?.batch_header?.payout_batch_id;

    const markedPaid =
      batchStatus === "SUCCESS" ||
      batchStatus === "PENDING" ||
      batchStatus === "PROCESSING";

    if (markedPaid) {
      await admin
        .from("payout_requests")
        .update({
          status: batchStatus === "SUCCESS" ? "paid" : "processing",
          paid_at: batchStatus === "SUCCESS" ? new Date().toISOString() : null,
          notes: `paypal_batch_id=${paypalBatchId}; status=${batchStatus}`,
        })
        .eq("id", payoutId);

      if (batchStatus === "SUCCESS" && Array.isArray(payout.commission_ids)) {
        await admin
          .from("commissions")
          .update({ status: "paid" })
          .in("id", payout.commission_ids);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        batch_status: batchStatus,
        payout_batch_id: paypalBatchId,
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
