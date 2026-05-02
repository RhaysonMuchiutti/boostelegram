import { useState, Component, ReactNode, Suspense, lazy } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DashboardView } from "@/components/DashboardView";
import { CampaignForm } from "@/components/CampaignForm";
import { PrivacySettingsView } from "@/components/PrivacySettingsView";
import { BotFlowDesign } from "@/components/BotFlowDesign";
import { AutomationRulesView } from "@/components/AutomationRulesView";

// ErrorBoundary para capturar falhas críticas e evitar tela branca
class ErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode, fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Lazy loading EXTREMAMENTE cauteloso para os componentes que usam bibliotecas pesadas
const TelegramConnectView = lazy(() => 
  import("@/components/TelegramConnectView").then(module => ({ default: module.TelegramConnectView }))
    .catch(err => {
      console.error("Failed to load TelegramConnectView", err);
      return { default: () => <div className="p-8 text-center text-red-500">Erro ao carregar módulo de conexão. Tente recarregar a página.</div> };
    })
);

const TelegramInterface = lazy(() => 
  import("@/components/TelegramInterface").then(module => ({ default: module.TelegramInterface }))
    .catch(err => {
      console.error("Failed to load TelegramInterface", err);
      return { default: () => <div className="p-8 text-center text-red-500">Erro ao carregar interface do chat.</div> };
    })
);

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ErrorBoundary fallback={<div className="p-8 text-center text-red-500 font-semibold bg-red-50 rounded-xl m-4">Algo deu errado ao carregar esta seção. Por favor, recarregue a página.</div>}>
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "campaigns" && <CampaignForm />}
          {activeTab === "leads" && <TelegramConnectView />}
          {activeTab === "messages" && <TelegramInterface />}
          {activeTab === "automation" && <AutomationRulesView />}
          {activeTab === "settings" && <PrivacySettingsView />}
          {activeTab === "bot-flow" && <BotFlowDesign />}
        </Suspense>
      </ErrorBoundary>
      
      {activeTab !== "dashboard" && activeTab !== "campaigns" && activeTab !== "leads" && activeTab !== "messages" && activeTab !== "settings" && activeTab !== "automation" && activeTab !== "bot-flow" && (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-xl">
          Funcionalidade de {activeTab} em desenvolvimento...
        </div>
      )}
    </AdminLayout>
  );
};

export default Index;