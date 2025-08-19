
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrgBody {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
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

    const orgData: CreateOrgBody = await req.json();

    // Inserir organização com todos os campos
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: orgData.name,
        slug: orgData.slug,
        email: orgData.email,
        phone: orgData.phone,
        contact_person: orgData.contact_person,
        address: orgData.address,
        city: orgData.city,
        state: orgData.state,
        zip_code: orgData.zip_code,
        is_active: true,
      })
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
      return new Response(
        JSON.stringify({ error: "Organização criada, mas falha ao vincular usuário." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar páginas padrão para a organização
    const defaultPages = [
      'dashboard', 'products', 'customers', 'orders', 'pos', 'reports', 'settings'
    ];

    const pageInserts = defaultPages.map(pageKey => ({
      organization_id: org.id,
      page_key: pageKey,
      is_enabled: true,
    }));

    const { error: pagesError } = await admin
      .from("organization_pages")
      .insert(pageInserts);

    if (pagesError) {
      console.error("Erro ao criar páginas padrão:", pagesError);
      // Não falha a criação da organização por causa das páginas
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
