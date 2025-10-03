
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import bcrypt from "npm:bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChangePasswordBody {
  userId: string;
  newPassword: string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  
  // Cliente para validar o JWT do usuário
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: req.headers.get("Authorization")! },
    },
  });
  
  // Cliente com service role para operações administrativas
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Validar autenticação do usuário usando o cliente anon
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !authData?.user) {
      console.error("[change-password] Erro de autenticação:", authError);
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, newPassword }: ChangePasswordBody = await req.json();

    // Validar dados
    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: "ID do usuário e nova senha são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }), {
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

    // Verificar se o usuário autenticado tem permissão para alterar senha nesta organização
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

    // Gerar hash da nova senha
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    // Atualizar senha
    const { error: updateError } = await supabase
      .from("organization_users")
      .update({ password_hash: passwordHash })
      .eq("id", userId);

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError);
      return new Response(JSON.stringify({ error: "Erro ao atualizar senha" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Senha alterada com sucesso"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro ao alterar senha:", error);
    return new Response(JSON.stringify({ error: error?.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
