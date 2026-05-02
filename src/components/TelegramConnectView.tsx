import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, Smartphone, CheckCircle2, AlertCircle, PanelLeftOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const TelegramConnectView = () => {
  const [step, setStep] = useState<"intro" | "credentials" | "qr" | "loading" | "connected">("intro");
  const [timeLeft, setTimeLeft] = useState(60);
  const [qrString, setQrString] = useState(""); 
  const [apiCredentials, setApiCredentials] = useState({ appId: "", apiHash: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [telegramUser, setTelegramUser] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Carregar credenciais (API ID/Hash)
        const { data: creds } = await supabase
          .from("telegram_credentials")
          .select("api_id, api_hash")
          .eq("user_id", user.id)
          .maybeSingle();

        if (creds) {
          setApiCredentials({
            appId: creds.api_id,
            apiHash: creds.api_hash
          });
        }

        // 2. Carregar status da conexão
        const { data: conn } = await supabase
          .from("telegram_connections")
          .select("id, status, telegram_username")
          .eq("user_id", user.id)
          .maybeSingle();

        if (conn) {
          if (conn.status === "connected") {
            setStep("connected");
            setTelegramUser(conn.telegram_username);
          } else if (conn.status === "pending_qr") {
            // Se estiver pendente, tentamos reiniciar para pegar um QR novo
            // ou apenas deixamos o usuário iniciar manualmente
          }
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
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    if (timeLeft === 0 && step === "qr") {
      handleStartConnection(); // Refresh QR code when expired
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Limpa o polling ao desmontar ou mudar de passo
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPollingStatus = (connectionId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    console.log("Iniciando monitoramento da conexão:", connectionId);
    
    pollingRef.current = window.setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("telegram_connections")
          .select("status, telegram_username")
          .eq("id", connectionId)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar status:", error);
          return;
        }

        console.log("Status atual da conexão:", data?.status);

        if (data && data.status === "connected") {
          console.log("Conexão detectada! Parando polling.");
          if (pollingRef.current) clearInterval(pollingRef.current);
          
          const username = data.telegram_username || "Usuário";
          setTelegramUser(username);
          setStep("connected");
          
          toast.success(`Conectado como ${username}!`, {
            description: "Sua conta do Telegram foi vinculada com sucesso.",
            duration: 6000,
          });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  };

  const handleStartConnection = async () => {
    setIsLoading(true);
    setStep("loading");
    
    try {
      // Salvar ou atualizar as credenciais no banco de dados
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("telegram_credentials")
          .upsert({
            user_id: user.id,
            api_id: apiCredentials.appId,
            api_hash: apiCredentials.apiHash
          }, { onConflict: 'user_id' });
        
        toast.success("Credenciais salvas com sucesso!");
      }

      // Chamada para a Edge Function que vamos criar
      // Esta função vai iniciar o processo no backend seguro
      const { data, error } = await supabase.functions.invoke("telegram-connector", {
        body: { 
          action: "start-qr",
          apiId: apiCredentials.appId,
          apiHash: apiCredentials.apiHash
        }
      });

      if (error) throw error;

      if (data?.qr_link) {
        setQrString(data.qr_link);
        setStep("qr");
        setTimeLeft(60);
        if (data.connection_id) {
          startPollingStatus(data.connection_id);
        }
      } else {
        throw new Error("Não foi possível gerar o QR Code.");
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setStep("credentials");
      toast.error(err.message || "Erro ao conectar com o servidor do Telegram.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Conectar Telegram</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${step === "connected" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
          <span className={`text-sm font-medium ${step === "connected" ? "text-emerald-600" : "text-muted-foreground"}`}>
            {step === "connected" ? "Status: Conectado" : "Status: Desconectado"}
          </span>
        </div>
      </div>

      <Card className="border-2 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="pt-6">
          {step === "intro" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">Sessão Segura</h4>
                  <p className="text-xs text-muted-foreground">Sua conta permanece ativa em nossos servidores 24h.</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">Criptografia Real</h4>
                  <p className="text-xs text-muted-foreground">Conexão via MTProto (protocolo oficial do Telegram).</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">Aviso de Segurança</p>
                  <p>As chaves de API são armazenadas de forma criptografada apenas para manter sua automação rodando.</p>
                </div>
              </div>

              <Button className="w-full h-12 text-lg shadow-lg shadow-primary/20" onClick={() => setStep("credentials")}>
                Próximo Passo
              </Button>
            </div>
          )}

          {step === "credentials" && (
            <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-2">
                <h4 className="font-bold text-xl">Credenciais de Desenvolvedor</h4>
                <p className="text-sm text-muted-foreground">
                  Insira os dados obtidos em <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="text-primary underline font-bold">my.telegram.org</a>.
                </p>
              </div>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">API ID</label>
                  <input 
                    type="text"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Ex: 1234567"
                    value={apiCredentials.appId}
                    onChange={(e) => setApiCredentials({...apiCredentials, appId: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">API Hash</label>
                  <input 
                    type="text"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Ex: a1b2c3d4e5f6g7h8i9j0"
                    value={apiCredentials.apiHash}
                    onChange={(e) => setApiCredentials({...apiCredentials, apiHash: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                className="w-full h-12" 
                disabled={!apiCredentials.appId || !apiCredentials.apiHash || isLoading}
                onClick={handleStartConnection}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando ao Servidor...
                  </>
                ) : (
                  "Gerar QR Code Real"
                )}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("intro")} disabled={isLoading}>Voltar</Button>
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center py-12 space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <PanelLeftOpen className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/50" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-xl">Iniciando Ponte Segura</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Estamos preparando um ambiente isolado para sua conta no Supabase.
                </p>
              </div>
            </div>
          )}

          {step === "qr" && (
            <div className="flex flex-col items-center py-6 space-y-8 animate-in zoom-in-95">
              <div className="relative p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-100 group">
                <div className="p-2 bg-white">
                  <QRCode 
                    value={qrString} 
                    size={220}
                    level="M"
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                  <RefreshCw className="w-6 h-6" />
                </div>
              </div>

              <div className="text-center space-y-4 max-w-sm">
                <div className="space-y-2">
                  <p className="font-bold text-2xl">Escaneie o Código Real</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No Telegram: <b>Configurações</b> {">"} <b>Dispositivos</b> {">"} <b>Conectar Dispositivo</b>
                  </p>
                </div>
                
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Expira em: <span className="text-primary">{timeLeft}s</span>
                </div>

                <p className="text-xs text-slate-400 italic">
                  O sistema detectará o escaneamento automaticamente.
                </p>
              </div>
            </div>
          )}

          {step === "connected" && (
            <div className="flex flex-col items-center py-12 space-y-6 animate-in fade-in">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-14 h-14" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold text-slate-900">Conta Conectada!</h3>
                <p className="text-muted-foreground text-lg">Seu Telegram agora está integrado ao servidor do GrupoBoost.</p>
              </div>
              <Button className="h-12 px-8 rounded-full" onClick={() => setStep("intro")}>
                Desconectar e Configurar Novo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};