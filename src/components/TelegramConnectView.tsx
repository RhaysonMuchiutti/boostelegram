import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, Smartphone, CheckCircle2, AlertCircle, PanelLeftOpen, RefreshCw, QrCode, Wifi, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const TelegramConnectView = () => {
  const [step, setStep] = useState<"intro" | "credentials" | "qr" | "loading" | "connected">("intro");
  const [timeLeft, setTimeLeft] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [qrString, setQrString] = useState(""); 
  const [apiCredentials, setApiCredentials] = useState({ appId: "", apiHash: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [telegramUser, setTelegramUser] = useState<string | null>(null);
  const [isVerifyingExtra, setIsVerifyingExtra] = useState(false);
  const [currentConnId, setCurrentConnId] = useState<string | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: creds } = await supabase
          .from("telegram_credentials")
          .select("api_id, api_hash")
          .eq("user_id", user.id)
          .maybeSingle();

        if (creds) {
          setApiCredentials({ appId: creds.api_id, apiHash: creds.api_hash });
        }

        const { data: conn } = await supabase
          .from("telegram_connections")
          .select("id, status, telegram_username")
          .eq("user_id", user.id)
          .maybeSingle();

        if (conn && conn.status === "connected") {
          setStep("connected");
          setTelegramUser(conn.telegram_username);
        }
      } catch (err) {
        console.error("Error loading telegram data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "qr" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((t) => t - 1);
        setElapsed((e) => e + 1);
      }, 1000);
    }
    if (timeLeft === 0 && step === "qr") {
      handleStartConnection(); 
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  const verifyConnectionStatus = async (connectionId: string) => {
    setIsVerifyingExtra(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const { data, error } = await supabase
        .from("telegram_connections")
        .select("status, telegram_username")
        .eq("id", connectionId)
        .single();

      if (error) throw error;

      if (data && data.status === "connected") {
        const username = data.telegram_username || "Usuário";
        setTelegramUser(username);
        setStep("connected");
        toast.success("Conexão confirmada!", {
          description: `Sua conta foi vinculada com sucesso.`,
          duration: 5000,
        });
        return true;
      } else {
        toast.info("Aguardando confirmação...", {
          description: "Confirme a conexão no seu aplicativo do Telegram."
        });
        return false;
      }
    } catch (err) {
      console.error("Erro na verificação:", err);
      return false;
    } finally {
      setIsVerifyingExtra(false);
    }
  };

  const startRealtimeStatus = (connectionId: string) => {
    if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
    const channel = supabase
      .channel(`conn-${connectionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'telegram_connections',
        filter: `id=eq.${connectionId}`,
      }, async (payload) => {
        const newData = payload.new as any;
        if (newData.status === 'connected') {
          await verifyConnectionStatus(connectionId);
        }
      })
      .subscribe();
    realtimeChannelRef.current = channel;
  };

  const handleStartConnection = async () => {
    setIsLoading(true);
    setStep("loading");
    setElapsed(0);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("telegram_credentials").upsert({
          user_id: user.id,
          api_id: apiCredentials.appId,
          api_hash: apiCredentials.apiHash
        }, { onConflict: 'user_id' });
      }

      const { data, error } = await supabase.functions.invoke("telegram-connector", {
        body: { action: "start-qr", apiId: apiCredentials.appId, apiHash: apiCredentials.apiHash }
      });

      if (error) throw error;
      if (data?.qr_link) {
        setQrString(data.qr_link);
        setStep("qr");
        setTimeLeft(60);
        if (data.connection_id) {
          setCurrentConnId(data.connection_id);
          startRealtimeStatus(data.connection_id);
        }
      }
    } catch (err: any) {
      setStep("credentials");
      toast.error("Erro ao iniciar conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  const stepsList = [
    { id: 1, label: "Credenciais", status: step === "intro" || step === "credentials" ? "current" : "done" },
    { id: 2, label: "Escaneamento", status: step === "qr" ? "current" : (step === "connected" ? "done" : "todo") },
    { id: 3, label: "Confirmação", status: step === "qr" && elapsed > 2 ? "current" : (step === "connected" ? "done" : "todo") },
    { id: 4, label: "Conectado", status: step === "connected" ? "done" : "todo" }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight">Vincular Telegram</h2>
        
        {/* Stepper Progress */}
        <div className="flex items-center justify-between max-w-md mx-auto relative px-2">
          {stepsList.map((s, idx) => (
            <div key={s.id} className="flex flex-col items-center z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                s.status === "done" ? "bg-emerald-500 border-emerald-500 text-white" :
                s.status === "current" ? "border-primary bg-white text-primary animate-pulse" :
                "bg-slate-100 border-slate-200 text-slate-400"
              }`}>
                {s.status === "done" ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${
                s.status === "done" ? "text-emerald-600" :
                s.status === "current" ? "text-primary" : "text-slate-400"
              }`}>{s.label}</span>
            </div>
          ))}
          {/* Progress Lines */}
          <div className="absolute top-4 left-0 right-0 h-[2px] bg-slate-100 -z-0 mx-8" />
        </div>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
        <CardContent className="pt-6 relative min-h-[400px] flex flex-col justify-center">
          {isVerifyingExtra && (
            <div className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 animate-in fade-in">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <ShieldCheck className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold text-xl">Sincronizando Sessão</p>
                <p className="text-sm text-muted-foreground italic">Aguarde a resposta final do servidor...</p>
              </div>
            </div>
          )}

          {step === "intro" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary rotate-3">
                  <Smartphone className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">Modo Web x Mobile</h3>
                <p className="text-slate-500 max-w-sm">Mantenha sua automação rodando 24h sem precisar do celular ligado o tempo todo.</p>
              </div>
              <Button className="w-full h-14 text-lg font-bold rounded-2xl" onClick={() => setStep("credentials")}>
                Começar Configuração
              </Button>
            </div>
          )}

          {step === "credentials" && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-2">
                <h4 className="font-bold text-xl">1. Dados da API</h4>
                <p className="text-sm text-muted-foreground">Obtenha as chaves em my.telegram.org</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 ml-1">App API ID</label>
                  <input 
                    className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 focus:ring-2 ring-primary transition-all"
                    placeholder="Ex: 1234567"
                    value={apiCredentials.appId}
                    onChange={(e) => setApiCredentials({...apiCredentials, appId: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 ml-1">App API Hash</label>
                  <input 
                    className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 focus:ring-2 ring-primary transition-all"
                    placeholder="Ex: a1b2c3d4..."
                    value={apiCredentials.apiHash}
                    onChange={(e) => setApiCredentials({...apiCredentials, apiHash: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="h-14 flex-1 rounded-2xl" onClick={() => setStep("intro")}>Voltar</Button>
                <Button className="h-14 flex-[2] rounded-2xl" disabled={!apiCredentials.appId || !apiCredentials.apiHash} onClick={handleStartConnection}>
                  Gerar QR Code
                </Button>
              </div>
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center py-12 space-y-6 text-center">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-primary/30" />
                <Wifi className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xl">Criando Túnel Seguro</p>
                <p className="text-sm text-slate-400 italic">Conectando aos servidores do Telegram via MTProto...</p>
              </div>
            </div>
          )}

          {step === "qr" && (
            <div className="flex flex-col items-center py-4 space-y-6 animate-in zoom-in-95" role="region" aria-label="Área de autenticação via QR Code">
              <div className="p-6 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 relative group">
                <div className="p-2 bg-white rounded-xl">
                  <QRCode 
                    value={qrString} 
                    size={200} 
                    level="M" 
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    aria-label="Código QR para autenticação no Telegram"
                  />
                </div>
                {elapsed > 45 && (
                  <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 text-center rounded-[2.5rem] backdrop-blur-sm animate-in fade-in duration-300">
                    <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
                    <p className="text-xs font-bold text-slate-800">Conexão demorada</p>
                    <p className="text-[10px] text-slate-500 mb-4">O tempo expirou ou houve uma falha na rede.</p>
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={handleStartConnection} 
                      className="rounded-full h-9 px-6 shadow-lg shadow-primary/20"
                      aria-label="Gerar novo código QR"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-center space-y-4 max-w-sm w-full">
                <div className="space-y-1">
                  <p className="font-bold text-xl">2. Escaneie Agora</p>
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span>Configurações ➔ Dispositivos ➔ Conectar</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 items-center w-full">
                  <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full text-xs font-bold transition-all ${elapsed > 30 ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    <Clock className="w-3 h-3" />
                    Status: {elapsed}s decorridos
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[11px] text-slate-400 hover:text-primary transition-all underline-offset-4 hover:underline"
                    onClick={() => currentConnId && verifyConnectionStatus(currentConnId)}
                    disabled={isVerifyingExtra}
                  >
                    <RefreshCw className={`w-3 h-3 mr-2 ${isVerifyingExtra ? "animate-spin" : ""}`} />
                    {isVerifyingExtra ? "Validando..." : "Já confirmou no celular? Clique aqui"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "connected" && (
            <div className="flex flex-col items-center py-12 space-y-6 text-center animate-in zoom-in-95 duration-500">
              <div className="w-28 h-28 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-100/50">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold text-slate-900">Sucesso!</h3>
                <p className="text-emerald-600 font-bold text-lg">Olá, {telegramUser}!</p>
                <p className="text-slate-400 text-sm max-w-[240px] mx-auto leading-relaxed">Sua conta está integrada e pronta para receber automações.</p>
              </div>
              <Button className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800" onClick={() => setStep("intro")}>
                Gerenciar Conexão
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Help Footer */}
      {step === "qr" && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-[11px] text-amber-900 leading-relaxed">
            <p className="font-bold mb-1">Dica de conexão:</p>
            <p>Se você já escaneou e o status não mudou, verifique se o Telegram no celular exibiu a notificação "Novo Dispositivo Conectado". Caso contrário, tente re-escanear.</p>
          </div>
        </div>
      )}
    </div>
  );
};