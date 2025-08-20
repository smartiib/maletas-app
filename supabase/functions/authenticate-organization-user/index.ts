
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import bcrypt from "npm:bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginBody {
  email: string;
  password: string;
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
    const { email, password }: LoginBody = await req.json();

    // Validar dados
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "E-mail e senha são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar usuário por email com o nome da organização
    const { data: userWithOrg, error: userError } = await supabase
      .from("organization_users")
      .select(`
        *,
        organizations!inner(
          id,
          name,
          slug
        )
      `)
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (userError) {
      console.error("Erro ao buscar usuário:", userError);
      return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!userWithOrg) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Credenciais inválidas" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar senha
    const isValidPassword = bcrypt.compareSync(password, userWithOrg.password_hash);

    if (!isValidPassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Credenciais inválidas" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sucesso - remover password_hash da resposta e incluir dados da organização
    const { password_hash, organizations, ...userWithoutPassword } = userWithOrg;
    
    const userResponse = {
      ...userWithoutPassword,
      organization_name: organizations.name,
      organization_slug: organizations.slug
    };

    return new Response(JSON.stringify({
      success: true,
      user: userResponse
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro na autenticação:", error);
    return new Response(JSON.stringify({ error: error?.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
