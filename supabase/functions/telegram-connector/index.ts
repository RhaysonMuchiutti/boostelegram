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
        appVersion: "1.0.0"
      })

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

      // Record pending connection
      const { data: conn, error: connError } = await supabaseClient
        .from('telegram_connections')
        .upsert({ 
          user_id: user.id, 
          status: 'pending_qr',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (connError) throw connError

      // Keep waiting for the scan in the background
      const waitScan = (async () => {
        try {
          console.log("Waiting for user to scan QR...")
          const userResult = await signInPromise;
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

      // Convert Uint8Array to base64url
      const uint8 = new Uint8Array(qrData.token);
      let binary = '';
      for (let i = 0; i < uint8.byteLength; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64Token = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      return new Response(
        JSON.stringify({ 
          qr_link: `tg://login?token=${base64Token}`,
          connection_id: conn.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
