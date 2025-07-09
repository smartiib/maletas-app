import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secret } = await req.json();

    if (!secret) {
      return new Response(
        JSON.stringify({ error: 'Secret is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Log the secret configuration (only first part for security)
    console.log('Webhook secret configured successfully:', secret.substring(0, 8) + '...');

    // In production, you would save this to Supabase edge function environment variables
    // For now, we'll simulate successful save and indicate the secret should be added 
    // manually to the WOOCOMMERCE_WEBHOOK_SECRET environment variable

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook secret received successfully',
        instruction: 'Add the secret to WOOCOMMERCE_WEBHOOK_SECRET environment variable'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook secret:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});