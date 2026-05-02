import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, ShieldCheck, Loader2, Smartphone, CheckCircle2, AlertCircle } from "lucide-react";

export const TelegramConnectView = () => {
  const [step, setStep] = useState<"intro" | "qr" | "loading" | "connected">("intro");
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "qr" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Conectar Telegram</h2>
        <p className="text-muted-foreground text-lg">
          Sincronize sua conta para gerenciar comunidades de dentro do GrupoBoost
        </p>
      </div>

      <Card className="border-2">
        <CardContent className="pt-6">
          {step === "intro" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">Sessão Segura</h4>
                  <p className="text-xs text-muted-foreground">Conexão oficial via protocolo MTProto</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">Privacidade</h4>
                  <p className="text-xs text-muted-foreground">Seus dados são criptografados e protegidos</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">Atenção</p>
                  <p>Ao conectar via QR Code, o GrupoBoost poderá visualizar seus grupos e contatos para automatizar a captação.</p>
                </div>
              </div>

              <Button className="w-full h-12 text-lg" onClick={() => setStep("qr")}>
                Gerar QR Code de Conexão
              </Button>
            </div>
          )}

          {step === "qr" && (
            <div className="flex flex-col items-center py-6 space-y-6">
              <div className="relative p-6 bg-white border-4 border-slate-100 rounded-3xl shadow-xl">
                <div className="w-64 h-64 bg-slate-50 flex items-center justify-center relative">
                  <QrCode className="w-48 h-48 text-slate-900" />
                  {/* Overlay for fake activity */}
                  <div className="absolute inset-0 border-2 border-primary/20 animate-pulse rounded-lg" />
                </div>
              </div>

              <div className="text-center space-y-4 max-w-sm">
                <div className="space-y-1">
                  <p className="font-bold text-xl">Escaneie com seu Telegram</p>
                  <p className="text-sm text-muted-foreground">
                    Abra o Telegram {">"} Configurações {">"} Dispositivos {">"} Conectar Dispositivo
                  </p>
                </div>
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-mono text-slate-500">
                  O código expira em: <span className="text-primary font-bold">{timeLeft}s</span>
                </div>

                <Button variant="ghost" className="text-sm" onClick={() => setTimeLeft(60)}>
                  Gerar novo código
                </Button>
              </div>
            </div>
          )}

          {step === "connected" && (
            <div className="flex flex-col items-center py-12 space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-bold">Telegram Conectado!</h3>
                <p className="text-muted-foreground">Sua conta @usuario está pronta para uso.</p>
              </div>
              <Button className="mt-6" onClick={() => window.location.href = "/"}>
                Ir para o Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
