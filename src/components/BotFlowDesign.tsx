import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowRight, UserCheck, HelpCircle } from "lucide-react";

export const BotFlowDesign = () => {
  const steps = [
    {
      title: "1. Início (/start)",
      icon: MessageSquare,
      content: "Mensagem de boas-vindas personalizada com o nome do usuário e a promessa da campanha de origem.",
      buttons: ["Sim, eu aceito", "Não"]
    },
    {
      title: "2. Consentimento LGPD",
      icon: UserCheck,
      content: "Registro obrigatório do opt-in. Se 'Não', o bot encerra e o lead é marcado como inativo.",
      buttons: ["/sair para revogar a qualquer momento"]
    },
    {
      title: "3. Segmentação",
      icon: ArrowRight,
      content: "Pergunta sobre o interesse principal do usuário (Tráfego, Renda Extra, etc).",
      buttons: ["Opção A", "Opção B", "Opção C"]
    },
    {
      title: "4. Entrega",
      icon: HelpCircle,
      content: "Envio do link único do grupo correspondente ao interesse selecionado.",
      buttons: ["Entrar no Grupo"]
    }
  ];

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-slate-100 font-bold text-4xl leading-none">
              0{i + 1}
            </div>
            <CardHeader>
              <step.icon className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-base">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{step.content}</p>
              <div className="flex flex-wrap gap-2">
                {step.buttons.map((btn, j) => (
                  <span key={j} className="px-2 py-1 rounded bg-slate-100 text-[10px] font-mono text-slate-600 border border-slate-200">
                    {btn}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comandos Suportados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { cmd: "/start", desc: "Reinicia o fluxo de captação e boas-vindas" },
              { cmd: "/sair", desc: "Revoga o consentimento e para de receber mensagens" },
              { cmd: "/grupos", desc: "Lista os grupos que o usuário já tem acesso" },
              { cmd: "/ajuda", desc: "Mostra suporte e link da política de privacidade" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50">
                <code className="px-2 py-1 bg-white rounded border font-bold text-primary">
                  {item.cmd}
                </code>
                <span className="text-sm text-slate-600">{item.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
