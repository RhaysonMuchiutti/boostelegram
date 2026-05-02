import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, Smartphone, CheckCircle2, AlertCircle, PanelLeftOpen } from "lucide-react";
import { toast } from "sonner";

export const TelegramConnectView = () => {
  const [step, setStep] = useState<"intro" | "credentials" | "qr" | "loading" | "connected">("intro");
  const [timeLeft, setTimeLeft] = useState(60);
  const [qrString, setQrString] = useState(""); 
  const [apiCredentials, setApiCredentials] = useState({ appId: "", apiHash: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "qr" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleStartConnection = async () => {
    setIsLoading(true);
    setStep("loading");
    
    // Simulação segura que não quebra o app
    setTimeout(() => {
      setQrString("tg://login?token=SIMULADO_" + Math.random());
      setStep("qr");
      setIsLoading(false);
      toast.info("Atenção: A conexão real via MTProto requer configurações de servidor (Edge Functions).");
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Conectar Telegram</h2>
        <p className="text-muted-foreground text-lg">
          Sincronize sua conta via QR Code
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
                  <h4 className="font-semibold">Segurança</h4>
                  <p className="text-xs text-muted-foreground">Conexão protegida</p>
                </div>
              </div>

              <Button className="w-full h-12 text-lg shadow-lg shadow-primary/20" onClick={() => setStep("credentials")}>
                Começar Configuração
              </Button>
            </div>
          )}

          {step === "credentials" && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h4 className="font-bold text-xl">Configuração</h4>
                <p className="text-sm text-muted-foreground">Insira as credenciais do seu App Telegram.</p>
              </div>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">API ID</label>
                  <input 
                    type="text"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
                    value={apiCredentials.appId}
                    onChange={(e) => setApiCredentials({...apiCredentials, appId: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">API Hash</label>
                  <input 
                    type="text"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none"
                    value={apiCredentials.apiHash}
                    onChange={(e) => setApiCredentials({...apiCredentials, apiHash: e.target.value})}
                  />
                </div>
              </div>

              <Button className="w-full h-12" onClick={handleStartConnection}>
                Gerar QR Code
              </Button>
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center py-12 space-y-6">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="font-bold text-lg">Iniciando módulo...</p>
            </div>
          )}

          {step === "qr" && (
            <div className="flex flex-col items-center py-6 space-y-8 animate-in zoom-in-95">
              <div className="relative p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-100">
                <QRCode value={qrString} size={220} />
              </div>
              <div className="text-center space-y-4">
                <p className="font-bold text-2xl">Escaneie o Código</p>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-100 text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Expira em: <span className="text-primary font-bold">{timeLeft}s</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};