
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserBody {
  userId: string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

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
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId }: DeleteUserBody = await req.json();

    // Validar dados
    if (!userId) {
      return new Response(JSON.stringify({ error: "ID do usuário é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar o usuário para verificar se existe e obter a organização
    const { data: user, error: userError } = await supabase
      .from("organization_users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se o usuário autenticado tem permissão para excluir usuários nesta organização
    const { data: userOrg, error: userOrgError } = await supabase
      .from("user_organizations")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("organization_id", user.organization_id)
      .maybeSingle();

    if (userOrgError || !userOrg) {
      return new Response(JSON.stringify({ error: "Sem permissão para esta organização" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Excluir usuário
    const { error: deleteError } = await supabase
      .from("organization_users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Erro ao excluir usuário:", deleteError);
      return new Response(JSON.stringify({ error: "Erro ao excluir usuário" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Usuário excluído com sucesso"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro ao excluir usuário:", error);
    return new Response(JSON.stringify({ error: error?.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
