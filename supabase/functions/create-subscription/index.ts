import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSubscriptionRequest {
  organizationId: string;
  planId: string;
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX";
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
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

    const { organizationId, planId, billingType, creditCard }: CreateSubscriptionRequest = await req.json();

    // Buscar dados da organização e plano
    const { data: org } = await supabase
      .from("organizations")
      .select("asaas_customer_id, name")
      .eq("id", organizationId)
      .single();

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!org?.asaas_customer_id) {
      throw new Error("Cliente Asaas não encontrado para esta organização");
    }

    if (!plan) {
      throw new Error("Plano não encontrado");
    }

    // Criar assinatura na Asaas
    const subscriptionData: any = {
      customer: org.asaas_customer_id,
      billingType,
      value: plan.price_monthly,
      cycle: "MONTHLY",
      description: `Assinatura ${plan.name} - ${org.name}`,
    };

    if (billingType === "CREDIT_CARD" && creditCard) {
      subscriptionData.creditCard = {
        holderName: creditCard.holderName,
        number: creditCard.number,
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      };
      subscriptionData.creditCardHolderInfo = {
        name: creditCard.holderName,
        email: org.asaas_customer_id, // Usar o email da organização
        cpfCnpj: "00000000000", // Você pode adicionar um campo para CPF/CNPJ
        postalCode: "00000000",
        addressNumber: "123",
        phone: "11999999999",
      };
    }

    const asaasResponse = await fetch("https://www.asaas.com/api/v3/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": Deno.env.get("ASAAS_API_KEY") ?? "",
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!asaasResponse.ok) {
      const error = await asaasResponse.text();
      throw new Error(`Erro na API Asaas: ${error}`);
    }

    const asaasSubscription = await asaasResponse.json();

    // Criar/atualizar assinatura no Supabase
    const currentDate = new Date();
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { data: subscription } = await supabase
      .from("subscriptions")
      .upsert({
        organization_id: organizationId,
        plan_id: planId,
        asaas_subscription_id: asaasSubscription.id,
        status: asaasSubscription.status === "ACTIVE" ? "active" : "trialing",
        current_period_start: currentDate.toISOString(),
        current_period_end: nextMonth.toISOString(),
      })
      .select()
      .single();

    // Criar registro de pagamento se já foi processado
    if (asaasSubscription.status === "ACTIVE") {
      await supabase.from("payments").insert({
        subscription_id: subscription.id,
        asaas_payment_id: asaasSubscription.id,
        amount: plan.price_monthly,
        status: "confirmed",
        payment_date: currentDate.toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: asaasSubscription,
        supabaseSubscription: subscription 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});