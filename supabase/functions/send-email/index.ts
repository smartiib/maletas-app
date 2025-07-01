import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  organizationId: string;
}

interface SMTPConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
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

    const { to, subject, html, text, organizationId }: EmailRequest = await req.json();

    // Buscar configurações SMTP da organização
    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (!orgData) {
      throw new Error("Organização não encontrada");
    }

    // Por enquanto, usar configurações padrão do localStorage
    // Em produção, essas configurações deveriam estar no banco de dados
    const defaultConfig: SMTPConfig = {
      smtpHost: "smtp1.xmailer.com.br",
      smtpPort: "587",
      smtpUser: "smtp@smartiib.com.br",
      smtpPassword: "48OM7Yc4oqqXdez",
      smtpSecure: true,
      fromEmail: "smtp@smartiib.com.br",
      fromName: "Sistema WooCommerce"
    };

    // Preparar dados do e-mail
    const emailData = {
      from: `${defaultConfig.fromName} <${defaultConfig.fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>/g, ''), // Strip HTML se não tiver texto
    };

    // Simular envio de e-mail
    // Em uma implementação real, você usaria uma biblioteca SMTP como nodemailer
    console.log("Enviando e-mail:", emailData);
    console.log("Configurações SMTP:", {
      host: defaultConfig.smtpHost,
      port: defaultConfig.smtpPort,
      secure: defaultConfig.smtpSecure,
      user: defaultConfig.smtpUser
    });

    // Log do envio
    await supabase
      .from("email_logs")
      .insert({
        organization_id: organizationId,
        to_email: Array.isArray(to) ? to.join(",") : to,
        subject,
        status: "sent",
        sent_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "E-mail enviado com sucesso",
        messageId: `msg_${Date.now()}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});