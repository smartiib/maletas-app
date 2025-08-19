
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrgBody {
  name: string;
  slug: string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    // Validar autenticação do usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;

    const { name, slug }: CreateOrgBody = await req.json();

    // Inserir organização
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name, slug })
      .select()
      .single();

    if (orgError) {
      console.error("Erro ao inserir organização:", orgError);
      return new Response(
        JSON.stringify({ error: orgError.message || "Falha ao criar organização" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vincular usuário à organização
    const { error: linkError } = await admin
      .from("user_organizations")
      .insert({ user_id: userId, organization_id: org.id });

    if (linkError) {
      console.error("Erro ao vincular usuário à organização:", linkError);
      // Opcionalmente, poderíamos remover a org criada, mas manter simples: informe erro.
      return new Response(
        JSON.stringify({ error: "Organização criada, mas falha ao vincular usuário." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, organization: org }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro geral create-organization:", error);
    return new Response(JSON.stringify({ error: error?.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
