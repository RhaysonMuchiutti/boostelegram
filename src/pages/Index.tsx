import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { DashboardView } from "@/components/DashboardView";
import { CampaignForm } from "@/components/CampaignForm";
import { PrivacySettingsView } from "@/components/PrivacySettingsView";
import { BotFlowDesign } from "@/components/BotFlowDesign";
import { TelegramConnectView } from "@/components/TelegramConnectView";
import { TelegramInterface } from "@/components/TelegramInterface";
import { AutomationRulesView } from "@/components/AutomationRulesView";
import { TelegramSettingsView } from "@/components/TelegramSettingsView";
import { GroupManagerView } from "@/components/GroupManagerView";
import { NicheFinderView } from "@/components/NicheFinderView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "dashboard" && <DashboardView />}
      {activeTab === "campaigns" && <CampaignForm />}
      {activeTab === "leads" && <TelegramConnectView />}
      {activeTab === "messages" && <TelegramInterface />}
      {activeTab === "automation" && <AutomationRulesView />}
      {activeTab === "settings" && <PrivacySettingsView />}
      {activeTab === "telegram-api" && <TelegramSettingsView />}
      {activeTab === "bot-flow" && <BotFlowDesign />}
      {activeTab === "group-manager" && <GroupManagerView />}
      {activeTab === "niche-finder" && <NicheFinderView />}
    </AdminLayout>
  );
};

export default Index;