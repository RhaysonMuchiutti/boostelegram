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

// Helper for audit logs
async function logAudit(supabaseClient: any, userId: string, status: string, reason?: string, details: any = {}) {
  await supabaseClient
    .from('connection_audit_logs')
    .insert({
      user_id: userId,
      status,
      reason,
      details
    });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, apiId, apiHash, chatId, message, limit, offsetId } = body
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')!
    
    const supabaseUserClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    })

    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    })

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    if (action === 'start-qr') {
      console.log(`Starting QR for user ${user.id}`)
      
      const { data: currentConn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (currentConn?.status === 'connected') {
        return new Response(
          JSON.stringify({ error: 'Already connected', status: 'connected' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
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

        const handleScan = async () => {
          try {
            await logStep(supabaseAdminClient, user.id, "waiting_for_scan");
            
            await Promise.race([
              signInPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout (5min)")), 300000))
            ]);
            
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
            await logAudit(supabaseAdminClient, user.id, 'connected', 'Initial connection success');

          } catch (e: any) {
            await logStep(supabaseAdminClient, user.id, "scan_error", { error: e.message });
            await supabaseAdminClient
              .from('telegram_connections')
              .update({ status: 'disconnected', last_error: e.message })
              .eq('user_id', user.id)
              .neq('status', 'connected');
            await logAudit(supabaseAdminClient, user.id, 'disconnected', `Scan failed: ${e.message}`);
          } finally {
            try {
              if (client.connected) await client.disconnect();
            } catch (err) {}
          }
        };

        handleScan();

        const tokenBytes = new Uint8Array(qrData.token);
        const base64Token = btoa(Array.from(tokenBytes, byte => String.fromCharCode(byte)).join(''))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        return new Response(
          JSON.stringify({ 
            qr_link: `tg://login?token=${base64Token}`,
            connection_id: user.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (err) {
        await client.disconnect()
        throw err
      }
    }

    if (action === 'check-status') {
      const { data: conn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('session_string, telegram_username, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!conn || !conn.session_string || conn.status !== 'connected') {
        return new Response(JSON.stringify({ status: 'disconnected' }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const client = new TelegramClient(new StringSession(conn.session_string), parseInt(apiId || "0"), apiHash || "", {
        connectionRetries: 1,
      });

      try {
        await client.connect();
        const me = await client.getMe();
        await client.disconnect();
        
        if (me) {
          await logAudit(supabaseAdminClient, user.id, 'connected', 'Auto-check verified');
          return new Response(JSON.stringify({ status: 'connected', username: conn.telegram_username }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        } else {
          throw new Error("Invalid session");
        }
      } catch (e: any) {
        await supabaseAdminClient
          .from('telegram_connections')
          .update({ status: 'disconnected', updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        
        await logAudit(supabaseAdminClient, user.id, 'disconnected', `Check failed: ${e.message}`);
          
        return new Response(JSON.stringify({ status: 'disconnected' }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    if (action === 'get-chats') {
      const { data: conn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('session_string')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!conn?.session_string) {
        throw new Error('No active session');
      }

      const client = new TelegramClient(new StringSession(conn.session_string), parseInt(apiId), apiHash, {
        connectionRetries: 1,
      });

      try {
        await client.connect();
        const dialogs = await client.getDialogs({ limit: 20 });
        const chats = dialogs.map(d => ({
          id: d.id.toString(),
          name: d.title || "Unknown",
          lastMsg: d.message?.message || "",
          time: d.message?.date ? (() => { try { return new Date(d.message.date * 1000).toISOString(); } catch { return ""; } })() : "",
          unread: d.unreadCount,
          isGroup: d.isGroup || d.isChannel,
          members: (d.entity as any).participantsCount || 0
        }));
        await client.disconnect();
        return new Response(JSON.stringify({ chats }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e: any) {
        throw e;
      }
    }

    if (action === 'get-messages') {
      const msgLimit = limit || 30;
      const { data: conn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('session_string')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!conn?.session_string) throw new Error('No session');

      const client = new TelegramClient(new StringSession(conn.session_string), parseInt(apiId), apiHash, {
        connectionRetries: 1,
      });

      try {
        await client.connect();
        const messages = await client.getMessages(chatId, { 
          limit: msgLimit,
          offsetId: offsetId ? parseInt(offsetId) : undefined
        });
        const result = messages.map(m => ({
          id: m.id,
          text: m.message,
          date: m.date ? new Date(m.date * 1000).toISOString() : new Date().toISOString(),
          fromMe: m.out,
          senderName: m.fromId ? 'Other' : 'Me'
        }));
        await client.disconnect();
        return new Response(JSON.stringify({ messages: result }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e: any) {
        throw e;
      }
    }

    if (action === 'send-message') {
      const { data: conn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('session_string')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!conn?.session_string) throw new Error('No session');

      const client = new TelegramClient(new StringSession(conn.session_string), parseInt(apiId), apiHash, {
        connectionRetries: 1,
      });

      try {
        await client.connect();
        await client.sendMessage(chatId, { message });
        await client.disconnect();
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e: any) {
        throw e;
      }
    }

    if (action === 'get-participants') {
      const { data: conn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('session_string')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!conn?.session_string) throw new Error('No session');

      const client = new TelegramClient(new StringSession(conn.session_string), parseInt(apiId), apiHash, {
        connectionRetries: 1,
      });

      try {
        await client.connect();
        const participants = await client.getParticipants(chatId);
        const result = participants.map((p: any) => ({
          id: p.id.toString(),
          username: p.username,
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          isBot: p.bot
        }));
        await client.disconnect();
        return new Response(JSON.stringify({ participants: result }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e: any) {
        throw e;
      }
    }

    if (action === 'add-members') {
      const { groupId, participantsList } = body;
      const { data: conn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('session_string')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!conn?.session_string) throw new Error('No session');

      const client = new TelegramClient(new StringSession(conn.session_string), parseInt(apiId), apiHash, {
        connectionRetries: 1,
      });

      try {
        await client.connect();
        const results = [];
        const usersToAdd = participantsList.split(/[\n,;]+/).map((u: string) => u.trim()).filter(Boolean);
        
        for (const userHandle of usersToAdd) {
          try {
            await client.invoke(new Api.channels.InviteToChannel({
              channel: groupId,
              users: [userHandle]
            }));
            results.push({ user: userHandle, status: 'added' });
          } catch (e: any) {
            results.push({ user: userHandle, status: 'error', error: e.message });
          }
        }
        
        await client.disconnect();
        return new Response(JSON.stringify({ results }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e: any) {
        throw e;
      }
    }

    if (action === 'get-my-groups') {
      const { data: conn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('session_string')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!conn?.session_string) throw new Error('No session');

      const client = new TelegramClient(new StringSession(conn.session_string), parseInt(apiId), apiHash, {
        connectionRetries: 1,
      });

      try {
        await client.connect();
        const dialogs = await client.getDialogs({});
        const myGroups = dialogs
          .filter(d => (d.isGroup || d.isChannel) && (d.entity as any).creator)
          .map(d => ({
            id: d.id.toString(),
            title: d.title,
            participantsCount: (d.entity as any).participantsCount || 0,
            isChannel: d.isChannel,
            isAdmin: true
          }));
          
        await client.disconnect();
        return new Response(JSON.stringify({ groups: myGroups }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e: any) {
        throw e;
      }
    }

    if (action === 'remove-members') {
      const { groupId, userIds } = body;
      const { data: conn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('session_string')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!conn?.session_string) throw new Error('No session');

      const client = new TelegramClient(new StringSession(conn.session_string), parseInt(apiId), apiHash, {
        connectionRetries: 1,
      });

      try {
        await client.connect();
        const results = [];
        const idsToRemove = Array.isArray(userIds) ? userIds : [userIds];
        
        for (const userId of idsToRemove) {
          try {
            // kickParticipant handles both groups and channels
            await client.kickParticipant(groupId, userId);
            results.push({ user: userId, status: 'removed' });
          } catch (e: any) {
            results.push({ user: userId, status: 'error', error: e.message });
          }
        }
        
        await client.disconnect();
        return new Response(JSON.stringify({ results }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e: any) {
        throw e;
      }
    }

    if (action === 'replace-members') {
      const { groupId, removeUserIds, addUserList } = body;
      const { data: conn } = await supabaseAdminClient
        .from('telegram_connections')
        .select('session_string')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!conn?.session_string) throw new Error('No session');

      const client = new TelegramClient(new StringSession(conn.session_string), parseInt(apiId), apiHash, {
        connectionRetries: 1,
      });

      try {
        await client.connect();
        const results = { removed: [], added: [] };
        
        // 1. Remove
        const idsToRemove = Array.isArray(removeUserIds) ? removeUserIds : [];
        for (const userId of idsToRemove) {
          try {
            await client.kickParticipant(groupId, userId);
            results.removed.push({ user: userId, status: 'removed' });
          } catch (e: any) {
            results.removed.push({ user: userId, status: 'error', error: e.message });
          }
        }

        // 2. Add
        const usersToAdd = addUserList ? addUserList.split(/[\n,;]+/).map((u: string) => u.trim()).filter(Boolean) : [];
        for (const userHandle of usersToAdd) {
          try {
            await client.invoke(new Api.channels.InviteToChannel({
              channel: groupId,
              users: [userHandle]
            }));
            results.added.push({ user: userHandle, status: 'added' });
          } catch (e: any) {
            results.added.push({ user: userHandle, status: 'error', error: e.message });
          }
        }
        
        await client.disconnect();
        return new Response(JSON.stringify({ results }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      } catch (e: any) {
        throw e;
      }
    }

  } catch (error: any) {
    console.error("Function Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
