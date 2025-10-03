
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import bcrypt from "npm:bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserBody {
  organizationId: string;
  email: string;
  name: string;
  password: string;
}

async function findUserByEmail(admin: ReturnType<typeof createClient>, email: string) {
  // Busca por email usando paginação da Admin API (não há endpoint direto por e-mail)
  const perPage = 200;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await (admin as any).auth.admin.listUsers({ page, perPage });
    if (error) {
      console.warn("[create-organization-user] listUsers warning:", error);
      break;
    }
    const users = data?.users || [];
    const found = users.find((u: any) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < perPage) break; // acabou
  }
  return null;
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

    const { organizationId, email, name, password }: CreateUserBody = await req.json();

    console.log("[create-organization-user] Dados recebidos:", { organizationId, email, name, hasPassword: !!password });

    // Validar dados
    if (!organizationId || !email || !name || !password) {
      console.error("[create-organization-user] Dados obrigatórios faltando:", { organizationId, email, name, hasPassword: !!password });
      return new Response(JSON.stringify({ error: "Dados obrigatórios não fornecidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se o usuário chamador tem permissão para a organização
    const { data: userOrg, error: userOrgError } = await admin
      .from("user_organizations")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    console.log("[create-organization-user] Verificação de permissão:", { 
      userId: authData.user.id, 
      organizationId, 
      hasPermission: !!userOrg,
      error: userOrgError?.message 
    });

    if (userOrgError || !userOrg) {
      console.error("[create-organization-user] Sem permissão:", { userOrgError, userOrg });
      return new Response(JSON.stringify({ error: "Sem permissão para esta organização" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se já existe um organization_user com este e-mail NESTA organização
    const { data: existingOrgUser } = await admin
      .from("organization_users")
      .select("id, organization_id")
      .eq("email", email)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (existingOrgUser) {
      console.log("[create-organization-user] Usuário já existente nesta organização, retornando sucesso idempotente");
      return new Response(JSON.stringify({
        success: true,
        user: {
          id: existingOrgUser.id,
          email,
          name,
          is_active: true,
        },
        info: "already_exists"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Garantir usuário no Supabase Auth
    // Tentar criar o usuário (com email confirmado para permitir login imediato)
    let authUserId: string | null = null;

    const { data: createdAuth, error: createAuthError } = await (admin as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (createAuthError) {
      console.warn("[create-organization-user] createUser error:", createAuthError?.message);
      
      // Se o erro for que o usuário já existe, isso é esperado e OK
      // Vamos proceder assumindo que o usuário existe no Auth
      if (createAuthError.message && createAuthError.message.includes("already been registered")) {
        console.log("[create-organization-user] Usuário já existe no Auth, prosseguindo...");
        // Vamos usar um placeholder ID - o importante é que o organization_user seja criado
        // O login será feito por email/senha mesmo
        authUserId = "existing-user";
      } else {
        console.error("[create-organization-user] Erro inesperado ao criar usuário Auth:", createAuthError);
        return new Response(JSON.stringify({ error: "Falha ao criar usuário de autenticação" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      authUserId = createdAuth?.user?.id ?? null;
    }

    if (!authUserId) {
      return new Response(JSON.stringify({ error: "Usuário de autenticação inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Vincular usuário à organização (se ainda não vinculado)
    // Pular esta etapa se usamos placeholder ID para usuário existente
    if (authUserId !== "existing-user") {
      const { data: existingLink } = await admin
        .from("user_organizations")
        .select("id")
        .eq("user_id", authUserId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!existingLink) {
        const { error: linkError } = await admin
          .from("user_organizations")
          .insert({ user_id: authUserId, organization_id: organizationId });

        if (linkError) {
          console.error("[create-organization-user] Erro ao vincular usuário à organização:", linkError);
          return new Response(
            JSON.stringify({ error: "Usuário criado, mas falha ao vincular à organização." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } else {
      console.log("[create-organization-user] Pulando vinculação para usuário existente");
    }

    // 3) Hash da senha e criar o registro interno em organization_users
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const { data: newUser, error: createError } = await admin
      .from("organization_users")
      .insert({
        organization_id: organizationId,
        email,
        name,
        password_hash: passwordHash,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("[create-organization-user] Erro ao criar organization_user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message || "Falha ao criar usuário" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sucesso
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        is_active: newUser.is_active,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[create-organization-user] Erro geral:", error);
    return new Response(JSON.stringify({ error: error?.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
