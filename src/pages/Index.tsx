import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DashboardView } from "@/components/DashboardView";
import { CampaignForm } from "@/components/CampaignForm";
import { PrivacySettingsView } from "@/components/PrivacySettingsView";
import { BotFlowDesign } from "@/components/BotFlowDesign";
import { TelegramConnectView } from "@/components/TelegramConnectView";
import { TelegramInterface } from "@/components/TelegramInterface";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "dashboard" && <DashboardView />}
      {activeTab === "campaigns" && <CampaignForm />}
      {activeTab === "messages" && <BotFlowDesign />}
      {activeTab === "settings" && <PrivacySettingsView />}
      {activeTab !== "dashboard" && activeTab !== "campaigns" && activeTab !== "settings" && (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-xl">
          Funcionalidade de {activeTab} em desenvolvimento...
        </div>
      )}
    </AdminLayout>
  );
};

export default Index;
