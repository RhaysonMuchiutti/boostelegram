import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { TelegramClient } from "npm:telegram@2.22.2"
import { StringSession } from "npm:telegram@2.22.2/sessions/index.js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, apiId, apiHash } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')!
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    if (action === 'start-qr') {
      console.log(`Starting QR for user ${user.id} with apiId ${apiId}`)
      
      const client = new TelegramClient(new StringSession(''), parseInt(apiId), apiHash, {
        connectionRetries: 5,
        deviceModel: "GrupoBoost Web",
        systemVersion: "1.0.0",
        appVersion: "1.0.0",
        useWSS: false // Help with stability in Edge runtime
      })

      try {
        await client.connect()

        let qrData: any = null;
        
        const signInPromise = client.signInUserWithQrCode(
          { apiId: parseInt(apiId), apiHash: apiHash },
          {
            qrCode: async (qr) => {
              console.log("QR received from Telegram")
              qrData = qr;
            },
            onError: async (err) => {
              console.error("Telegram QR Error:", err);
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
          throw new Error("Telegram demorou muito para gerar o QR Code. Tente novamente.")
        }

        // Record pending connection - check if exists, then update or insert
        const { data: existing } = await supabaseClient
          .from('telegram_connections')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        let conn: { id: string } | null = null;
        let connError: any = null;

        if (existing) {
          const { data, error } = await supabaseClient
            .from('telegram_connections')
            .update({ 
              status: 'pending_qr',
              session_string: null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select('id')
            .single()
          conn = data;
          connError = error;
        } else {
          const { data, error } = await supabaseClient
            .from('telegram_connections')
            .insert({ 
              user_id: user.id, 
              status: 'pending_qr',
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single()
          conn = data;
          connError = error;
        }

        if (connError) throw connError
        if (!conn) throw new Error("Falha ao registrar conexão")

        // Keep waiting for the scan in the background
        // Use a self-invoking function that doesn't block the response
        (async () => {
          try {
            console.log("Waiting for user to scan QR...")
            await signInPromise;
            console.log("QR Scan successful!");
            
            const sessionString = (client.session as any).save();
            
            const { error: updateError } = await supabaseClient
              .from('telegram_connections')
              .update({ 
                status: 'connected', 
                session_string: sessionString,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
              
            if (updateError) console.error("Error updating session:", updateError)
          } catch (e) {
            console.error("Error during scan wait:", e);
            await supabaseClient
              .from('telegram_connections')
              .update({ status: 'disconnected', updated_at: new Date().toISOString() })
              .eq('user_id', user.id);
          } finally {
            await client.disconnect()
          }
        })();

        // Convert the QR token to base64url correctly
        const tokenBytes = new Uint8Array(qrData.token);
        const base64Token = btoa(Array.from(tokenBytes, byte => String.fromCharCode(byte)).join(''))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        return new Response(
          JSON.stringify({ 
            qr_link: `tg://login?token=${base64Token}`,
            connection_id: conn.id
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

  } catch (error) {
    console.error("Function Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
