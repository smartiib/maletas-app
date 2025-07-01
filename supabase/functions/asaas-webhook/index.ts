import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    status: string;
    value: number;
    customer: string;
    subscription?: string;
  };
  subscription?: {
    id: string;
    status: string;
    customer: string;
    plan: {
      id: string;
      name: string;
    };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: AsaasWebhookPayload = await req.json();
    
    console.log("Webhook Asaas recebido:", payload);

    switch (payload.event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED":
        if (payload.payment) {
          await handlePaymentConfirmed(supabase, payload.payment);
        }
        break;

      case "PAYMENT_OVERDUE":
      case "PAYMENT_DELETED":
        if (payload.payment) {
          await handlePaymentFailed(supabase, payload.payment);
        }
        break;

      case "SUBSCRIPTION_CREATED":
      case "SUBSCRIPTION_UPDATED":
        if (payload.subscription) {
          await handleSubscriptionUpdate(supabase, payload.subscription);
        }
        break;

      case "SUBSCRIPTION_SUSPENDED":
      case "SUBSCRIPTION_CANCELLED":
        if (payload.subscription) {
          await handleSubscriptionCancelled(supabase, payload.subscription);
        }
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handlePaymentConfirmed(supabase: any, payment: any) {
  // Atualizar status do pagamento
  await supabase
    .from("payments")
    .update({
      status: "confirmed",
      payment_date: new Date().toISOString(),
    })
    .eq("asaas_payment_id", payment.id);

  // Se for de uma assinatura, ativar a assinatura
  if (payment.subscription) {
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("asaas_subscription_id", payment.subscription);
  }
}

async function handlePaymentFailed(supabase: any, payment: any) {
  await supabase
    .from("payments")
    .update({
      status: "failed",
    })
    .eq("asaas_payment_id", payment.id);

  // Se for de uma assinatura, suspender
  if (payment.subscription) {
    await supabase
      .from("subscriptions")
      .update({
        status: "past_due",
      })
      .eq("asaas_subscription_id", payment.subscription);
  }
}

async function handleSubscriptionUpdate(supabase: any, subscription: any) {
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status.toLowerCase(),
    })
    .eq("asaas_subscription_id", subscription.id);
}

async function handleSubscriptionCancelled(supabase: any, subscription: any) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
    })
    .eq("asaas_subscription_id", subscription.id);
}