import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  MessageCircle,
  Zap
} from "lucide-react";

interface CampaignLandingPageProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  benefits?: string[];
  socialProof?: string;
}

export const CampaignLandingPage = ({
  title = "Domine o Tráfego Pago e Scale suas Vendas",
  subtitle = "Participe da nossa comunidade exclusiva no Telegram e receba conteúdos diários sobre estratégias que estão gerando milhões.",
  ctaText = "Quero Entrar pelo Telegram",
  benefits = [
    "Acesso a estratégias exclusivas",
    "Networking com grandes players",
    "Planilhas e ferramentas gratuitas",
    "Avisos de lives e conteúdos novos"
  ],
  socialProof = "Junte-se a mais de 5.000 membros ativos."
}: CampaignLandingPageProps) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Header/Nav */}
      <nav className="border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">GrupoBoost</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
              <span>Acesso Gratuito & Seguro</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              {title}
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-600 max-w-2xl leading-relaxed">
              {subtitle}
            </p>

            <div className="space-y-4 pt-4">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl shadow-lg shadow-blue-200">
                <MessageCircle className="w-6 h-6" />
                {ctaText}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {socialProof}
              </p>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md lg:max-w-none">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <h3 className="text-xl font-bold mb-6">O que você vai encontrar:</h3>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} GrupoBoost. Respeitamos sua privacidade e não enviamos spam.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-xs text-slate-400">
            <a href="#" className="hover:underline">Políticas de Privacidade</a>
            <a href="#" className="hover:underline">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
