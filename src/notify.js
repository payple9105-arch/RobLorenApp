import { supabase } from "./supabaseClient";

export async function notifyOrder(payload) {
  try {
    await supabase.functions.invoke("send-order-notification", {
      body: payload,
    });
  } catch (e) {
    console.log("Notificación no enviada:", e?.message || e);
  }
}
