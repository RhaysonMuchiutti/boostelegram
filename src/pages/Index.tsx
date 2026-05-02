import { useState, Suspense, lazy, ErrorBoundary } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DashboardView } from "@/components/DashboardView";
import { CampaignForm } from "@/components/CampaignForm";
import { PrivacySettingsView } from "@/components/PrivacySettingsView";
import { BotFlowDesign } from "@/components/BotFlowDesign";
import { AutomationRulesView } from "@/components/AutomationRulesView";

// Carregamento preguiçoso para evitar que erros na biblioteca do Telegram quebrem o app todo
const TelegramConnectView = lazy(() => import("@/components/TelegramConnectView").then(m => ({ default: m.TelegramConnectView })));
const TelegramInterface = lazy(() => import("@/components/TelegramInterface").then(m => ({ default: m.TelegramInterface })));

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ErrorBoundary fallback={<div className="p-8 text-center">Ocorreu um erro ao carregar esta seção. Tente recarregar a página.</div>}>
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>

        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "campaigns" && <CampaignForm />}
        {activeTab === "leads" && <TelegramConnectView />}
        {activeTab === "messages" && <TelegramInterface />}
        {activeTab === "automation" && <AutomationRulesView />}
        {activeTab === "settings" && <PrivacySettingsView />}
      </Suspense>
      
      {/* Bot Flow visualization stays available if needed via developer tools or a specific hidden route */}
      {activeTab === "bot-flow" && <BotFlowDesign />}

      {activeTab !== "dashboard" && activeTab !== "campaigns" && activeTab !== "leads" && activeTab !== "messages" && activeTab !== "settings" && (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-xl">
          Funcionalidade de {activeTab} em desenvolvimento...
        </div>
      )}
    </AdminLayout>
  );
};

export default Index;
