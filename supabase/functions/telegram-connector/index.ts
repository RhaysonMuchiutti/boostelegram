import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { TelegramClient, Api } from "npm:telegram@2.22.2"
import { StringSession } from "npm:telegram@2.22.2/sessions/index.js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to log steps in the DB
async function logStep(supabaseClient: any, userId: string, step: string, details: any = {}) {
  const { data } = await supabaseClient
    .from('telegram_connections')
    .select('step_logs')
    .eq('user_id', userId)
    .maybeSingle();
  
  const currentLogs = data?.step_logs || [];
  const newLog = {
    step,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  await supabaseClient
    .from('telegram_connections')
    .update({ 
      step_logs: [...currentLogs, newLog],
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, apiId, apiHash } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')!
    
    // Client for user-specific actions (honors RLS)
    const supabaseUserClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    })

    // Client for system-level actions (bypasses RLS)
    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    })

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    if (action === 'start-qr') {
      console.log(`Starting QR for user ${user.id}`)
      
      const client = new TelegramClient(new StringSession(''), parseInt(apiId), apiHash, {
        connectionRetries: 5,
        deviceModel: "GrupoBoost Web",
        systemVersion: "1.0.0",
        appVersion: "1.0.0",
        useWSS: false,
        autoReconnect: true,
        dcId: 1,
      })

      try {
        await client.connect()
        await logStep(supabaseAdminClient, user.id, "tunnel_created", { status: "success" });

        let qrData: any = null;
        const signInPromise = client.signInUserWithQrCode(
          { apiId: parseInt(apiId), apiHash: apiHash },
          {
            qrCode: async (qr) => {
              console.log("QR received from Telegram")
              qrData = qr;
              await logStep(supabaseAdminClient, user.id, "qr_generated");
            },
            onError: async (err) => {
              console.error("Telegram QR Error:", err);
              await logStep(supabaseAdminClient, user.id, "qr_error", { error: err.message });
              return true;
            }
          }
        )

        // Wait for QR to be generated
        let attempts = 0;
        while (!qrData && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        if (!qrData) {
          await client.disconnect()
          await logStep(supabaseAdminClient, user.id, "timeout", { reason: "qr_not_generated" });
          throw new Error("Telegram demorou muito para gerar o QR Code.")
        }

        // Initialize connection entry if it doesn't exist
        const { data: existing } = await supabaseAdminClient
          .from('telegram_connections')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existing) {
          await supabaseAdminClient.from('telegram_connections').insert({ 
            user_id: user.id, 
            status: 'pending_qr',
            step_logs: [{ step: 'init', timestamp: new Date().toISOString() }]
          });
        } else {
          await supabaseAdminClient.from('telegram_connections').update({ 
            status: 'pending_qr',
            updated_at: new Date().toISOString()
          }).eq('user_id', user.id);
        }

        // Background handler for the scan process
        const handleScan = async () => {
          try {
            console.log(`[Background] Waiting for scan for user ${user.id}`);
            await logStep(supabaseAdminClient, user.id, "waiting_for_scan");
            
            const result = await Promise.race([
              signInPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout (5min)")), 300000))
            ]);
            
            console.log(`[Background] Scan detected!`);
            await logStep(supabaseAdminClient, user.id, "scan_detected");

            if (!client.connected) await client.connect();

            const me = await client.getMe();
            const userData = (me || {}) as Api.User;
            const displayName = userData.username || userData.firstName || "Usuário Telegram";

            const sessionString = (client.session as any).save();
            
            await supabaseAdminClient
              .from('telegram_connections')
              .update({ 
                status: 'connected', 
                session_string: sessionString,
                telegram_username: displayName,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);

            await logStep(supabaseAdminClient, user.id, "connection_finalized", { username: displayName });
            console.log("[Background] Connection success");

          } catch (e: any) {
            console.error("[Background] Scan process error:", e);
            await logStep(supabaseAdminClient, user.id, "scan_error", { error: e.message });
            await supabaseAdminClient
              .from('telegram_connections')
              .update({ status: 'disconnected', last_error: e.message })
              .eq('user_id', user.id)
              .neq('status', 'connected');
          } finally {
            try {
              await client.disconnect();
            } catch (err) {}
          }
        };

        // Use EdgeRuntime.waitUntil if available to keep the process alive
        if (typeof (globalThis as any).EdgeRuntime !== 'undefined' || (globalThis as any).Deno) {
          // In some environments we just invoke it and it stays alive for a bit
          handleScan();
        } else {
          handleScan();
        }

        // Return QR immediately
        const tokenBytes = new Uint8Array(qrData.token);
        const base64Token = btoa(Array.from(tokenBytes, byte => String.fromCharCode(byte)).join(''))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        return new Response(
          JSON.stringify({ 
            qr_link: `tg://login?token=${base64Token}`,
            connection_id: user.id // Using user_id as identifier
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (err) {
        await client.disconnect()
        throw err
      }
    }

    return new Response(JSON.stringify({ error: 'Action not supported' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error: any) {
    console.error("Function Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
