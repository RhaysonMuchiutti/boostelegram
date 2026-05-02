import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TelegramSettingsView = () => {
  const [credentials, setCredentials] = useState({ appId: "", apiHash: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("telegram_credentials")
        .select("api_id, api_hash")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !error) {
        setCredentials({
          appId: data.api_id,
          apiHash: data.api_hash
        });
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação simples
    if (!credentials.appId.trim() || !credentials.apiHash.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (!/^\d+$/.test(credentials.appId.trim())) {
      toast.error("O API ID deve conter apenas números.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("telegram_credentials")
        .upsert({
          user_id: user.id,
          api_id: credentials.appId.trim(),
          api_hash: credentials.apiHash.trim()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Credenciais salvas com sucesso!");
    } catch (error: any) {
      console.error("Error saving credentials:", error);
      toast.error("Erro ao salvar: " + (error.message || "Tente novamente mais tarde."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Configurações da API</h2>
        <p className="text-muted-foreground">
          Gerencie suas chaves de desenvolvedor do Telegram para habilitar conexões reais.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Chaves do Telegram
            </CardTitle>
            <CardDescription>
              Essas chaves são obrigatórias para gerar o QR Code de conexão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appId">App API ID</Label>
                <Input
                  id="appId"
                  placeholder="Ex: 1234567"
                  value={credentials.appId}
                  onChange={(e) => setCredentials({ ...credentials, appId: e.target.value })}
                  className="bg-slate-50/50"
                />
                <p className="text-[10px] text-muted-foreground">Somente números.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiHash">App API Hash</Label>
                <Input
                  id="apiHash"
                  placeholder="Ex: a1b2c3d4e5f6g7h8i9j0"
                  value={credentials.apiHash}
                  onChange={(e) => setCredentials({ ...credentials, apiHash: e.target.value })}
                  className="bg-slate-50/50"
                />
                <p className="text-[10px] text-muted-foreground">O código alfanumérico longo.</p>
              </div>

              <Button type="submit" className="w-full md:w-auto" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              Suas chaves são usadas apenas para estabelecer a conexão MTProto segura com o Telegram.
            </p>
            <div className="flex items-start gap-2 text-emerald-600">
              <CheckCircle2 className="w-3 h-3 mt-0.5" />
              <span>Criptografado em repouso.</span>
            </div>
            <div className="flex items-start gap-2 text-emerald-600">
              <CheckCircle2 className="w-3 h-3 mt-0.5" />
              <span>Acesso restrito ao seu usuário.</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 flex gap-2">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                Nunca compartilhe seu API Hash com ninguém. Ele dá controle total sobre sua conta.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};