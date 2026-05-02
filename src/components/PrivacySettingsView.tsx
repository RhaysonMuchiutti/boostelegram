import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Download, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PrivacySettingsView = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Privacidade e LGPD</h2>
          <p className="text-muted-foreground">Gerencie a conformidade de dados do seu SaaS</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Exportar Logs
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              Configuração de Consentimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Texto que será exibido no Bot do Telegram quando o usuário iniciar o fluxo.
            </p>
            <textarea 
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm"
              defaultValue="Você aceita receber conteúdos e convites relacionados a este tema? Prometemos não enviar spam e respeitar sua privacidade."
            />
            <Button className="w-full">Atualizar Texto</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-emerald-600" />
              Política de Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              URL da sua política de privacidade pública ou editor de texto.
            </p>
            <input 
              className="w-full p-2 rounded-md border border-input bg-background text-sm"
              placeholder="https://seusite.com/privacy"
            />
            <div className="p-4 bg-slate-50 rounded-lg border border-dashed text-xs text-slate-500">
              O link da política será incluído automaticamente no comando /ajuda do bot.
            </div>
            <Button variant="outline" className="w-full">Vincular URL</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-amber-600" />
            Logs Recentes de Consentimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="h-10 px-2 text-left font-medium text-muted-foreground">Lead</th>
                  <th className="h-10 px-2 text-left font-medium text-muted-foreground">Ação</th>
                  <th className="h-10 px-2 text-left font-medium text-muted-foreground">Data/Hora</th>
                  <th className="h-10 px-2 text-left font-medium text-muted-foreground">IP</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">@joaosilva</td>
                  <td className="p-2">
                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">Opt-in</span>
                  </td>
                  <td className="p-2">01/03/2024 14:20</td>
                  <td className="p-2">189.12.34.XX</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">@mariadesouza</td>
                  <td className="p-2">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">Opt-out</span>
                  </td>
                  <td className="p-2">01/03/2024 12:05</td>
                  <td className="p-2">177.45.12.XX</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Trash2 className="w-5 h-5" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            A exclusão de dados é permanente. Conforme a LGPD, o usuário tem o direito de solicitar a exclusão total de seus dados.
          </p>
          <Button variant="destructive">Excluir Todos os Leads Inativos</Button>
        </CardContent>
      </Card>
    </div>
  );
};
