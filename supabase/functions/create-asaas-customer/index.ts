import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCustomerRequest {
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
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

    const { organizationId, name, email, phone, cpfCnpj }: CreateCustomerRequest = await req.json();

    // Verificar se já existe customer para esta organização
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("asaas_customer_id")
      .eq("id", organizationId)
      .single();

    if (existingOrg?.asaas_customer_id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          customerId: existingOrg.asaas_customer_id,
          message: "Cliente já existe"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente na Asaas
    const asaasResponse = await fetch("https://www.asaas.com/api/v3/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": Deno.env.get("ASAAS_API_KEY") ?? "",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        cpfCnpj,
        notificationDisabled: false,
      }),
    });

    if (!asaasResponse.ok) {
      const error = await asaasResponse.text();
      throw new Error(`Erro na API Asaas: ${error}`);
    }

    const asaasCustomer = await asaasResponse.json();

    // Atualizar organização com ID do cliente Asaas
    await supabase
      .from("organizations")
      .update({ asaas_customer_id: asaasCustomer.id })
      .eq("id", organizationId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: asaasCustomer.id,
        customer: asaasCustomer 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});