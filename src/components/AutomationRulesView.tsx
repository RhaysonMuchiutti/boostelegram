import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Zap, 
  Plus, 
  Trash2, 
  MessageSquare, 
  ArrowRight,
  Bot,
  Play
} from "lucide-react";

interface Rule {
  id: string;
  trigger: string;
  response: string;
  isActive: boolean;
}

export const AutomationRulesView = () => {
  const [rules, setRules] = useState<Rule[]>([
    { id: "1", trigger: "quero entrar", response: "Olá! Que bom que você quer participar. Aceita nossos termos?", isActive: true },
    { id: "2", trigger: "ajuda", response: "Como posso te ajudar hoje? Digite 1 para Grupos, 2 para Suporte.", isActive: false },
  ]);

  const addRule = () => {
    const newRule: Rule = {
      id: Date.now().toString(),
      trigger: "",
      response: "",
      isActive: true
    };
    setRules([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automação de Respostas</h2>
          <p className="text-muted-foreground text-sm">Configure gatilhos para respostas automáticas no Telegram</p>
        </div>
        <Button onClick={addRule} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Regra
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={!rule.isActive ? "opacity-60" : ""}>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" /> Se o usuário digitar:
                    </Label>
                    <Input 
                      placeholder="Ex: quero participar, valor, suporte" 
                      value={rule.trigger}
                      onChange={(e) => {
                        const newRules = rules.map(r => r.id === rule.id ? { ...r, trigger: e.target.value } : r);
                        setRules(newRules);
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" /> Responder com:
                    </Label>
                    <textarea 
                      className="min-h-[80px] w-full p-3 rounded-md border border-input bg-background text-sm"
                      placeholder="Escreva a resposta automática aqui..."
                      value={rule.response}
                      onChange={(e) => {
                        const newRules = rules.map(r => r.id === rule.id ? { ...r, response: e.target.value } : r);
                        setRules(newRules);
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-between items-center gap-4 h-full">
                  <div className="flex flex-col items-center gap-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Ativo</Label>
                    <Switch 
                      checked={rule.isActive} 
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-slate-50/50">
          <Bot className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Nenhuma regra de automação criada ainda</p>
          <Button variant="link" onClick={addRule}>Comece agora adicionando sua primeira regra</Button>
        </div>
      )}
    </div>
  );
};
