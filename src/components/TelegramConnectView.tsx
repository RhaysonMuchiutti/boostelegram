import { useState, useEffect, useRef, lazy, Suspense } from "react";
// Importar QRCode de forma estática para remover o lazy problemático
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, Smartphone, CheckCircle2, AlertCircle, PanelLeftOpen } from "lucide-react";
// Importar dinamicamente a lógica do Telegram apenas no momento do clique
// Isso evita que o erro de carregamento aconteça na inicialização do app
import { toast } from "sonner";
import { Buffer } from "buffer";

export const TelegramConnectView = () => {
  const [step, setStep] = useState<"intro" | "credentials" | "qr" | "loading" | "connected">("intro");
  const [timeLeft, setTimeLeft] = useState(60);
  const [qrString, setQrString] = useState(""); 
  const [apiCredentials, setApiCredentials] = useState({ appId: "", apiHash: "" });
  const [isLoading, setIsLoading] = useState(false);
  const isConnecting = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "qr" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleStartConnection = async () => {
    if (isConnecting.current) return;
    
    setIsLoading(true);
    setStep("loading");
    isConnecting.current = true;

    try {
      // Importar dinamicamente a lógica do Telegram apenas aqui
      const { generateQrCode } = await import("@/lib/telegram");

      await generateQrCode(
        { 
          apiId: parseInt(apiCredentials.appId), 
          apiHash: apiCredentials.apiHash 
        },
        (qr) => {
          const base64Token = Buffer.from(qr.token).toString("base64url");
          const url = `tg://login?token=${base64Token}`;
          setQrString(url);
          setStep("qr");
          setIsLoading(false);
          setTimeLeft(60);
        },
        (session) => {
          localStorage.setItem("tg_session", session);
          setStep("connected");
          isConnecting.current = false;
          toast.success("Telegram conectado com sucesso!");
        },
        (error) => {
          console.error(error);
          setIsLoading(false);
          setStep("credentials");
          isConnecting.current = false;
          toast.error("Erro ao conectar: Verifique suas credenciais.");
        }
      );
    } catch (err) {
      console.error("Dynamic import error:", err);
      setIsLoading(false);
      setStep("credentials");
      isConnecting.current = false;
      toast.error("Erro ao carregar módulo do Telegram.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Conectar Telegram</h2>
        <p className="text-muted-foreground text-lg">
          Sincronize sua conta real via MTProto para controle total
        </p>
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
                  <h4 className="font-semibold">Sessão Direta</h4>
                  <p className="text-xs text-muted-foreground">Funciona como o Telegram Web oficial</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">Criptografia</h4>
                  <p className="text-xs text-muted-foreground">Conexão ponta-a-ponta protegida</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">Passo Necessário</p>
                  <p>Para conectar uma conta real, você precisará das credenciais de desenvolvedor do próprio Telegram.</p>
                </div>
              </div>

              <Button className="w-full h-12 text-lg shadow-lg shadow-primary/20" onClick={() => setStep("credentials")}>
                Começar Configuração
              </Button>
            </div>
          )}

          {step === "credentials" && (
            <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-2">
                <h4 className="font-bold text-xl">Passo 1: Credenciais</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="text-primary underline font-bold">my.telegram.org</a>, vá em "API development tools" e crie um app para obter seu ID e Hash.
                </p>
              </div>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">App API ID</label>
                  <input 
                    type="text"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Ex: 1234567"
                    value={apiCredentials.appId}
                    onChange={(e) => setApiCredentials({...apiCredentials, appId: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">App API Hash</label>
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
                    Iniciando Conexão...
                  </>
                ) : (
                  "Gerar QR Code de Sessão"
                )}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("intro")} disabled={isLoading}>Voltar</Button>
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center py-12 space-y-6">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-bold text-lg">Estabelecendo ponte com o Telegram...</p>
                <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
              </div>
            </div>
          )}

          {step === "qr" && (
            <div className="flex flex-col items-center py-6 space-y-8 animate-in zoom-in-95">
              <div className="relative p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-100">
                <div className="p-2">
                  <Suspense fallback={<div className="w-[220px] h-[220px] bg-slate-100 animate-pulse rounded-lg" />}>
                    <QRCode 
                      value={qrString} 
                      size={220}
                      level="M"
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </Suspense>
                </div>
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                  <PanelLeftOpen className="w-6 h-6" />
                </div>
              </div>

              <div className="text-center space-y-4 max-w-sm">
                <div className="space-y-2">
                  <p className="font-bold text-2xl">Escaneie o Código</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No seu celular, abra o <b>Telegram</b> {">"} <b>Configurações</b> {">"} <b>Dispositivos</b> {">"} <b>Conectar Dispositivo</b>
                  </p>
                </div>
                
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Expira em: <span className="text-primary font-bold">{timeLeft}s</span>
                </div>

                <div className="pt-4">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-400" onClick={() => setTimeLeft(60)}>
                    Problemas com o código? Tente gerar novamente.
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "connected" && (
            <div className="flex flex-col items-center py-12 space-y-6 animate-in fade-in">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-14 h-14" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold text-slate-900">Sucesso!</h3>
                <p className="text-muted-foreground text-lg">Sua conta está sincronizada com o GrupoBoost.</p>
              </div>
              <Button className="h-12 px-8 rounded-full" onClick={() => window.location.href = "/"}>
                Entrar no Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
