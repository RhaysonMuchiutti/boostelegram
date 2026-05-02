import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg",
      active 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
    {active && <ChevronRight className="w-4 h-4 ml-auto" />}
  </button>
);

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Menu Overlay */}
      {!isSidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed z-50 top-4 left-4 lg:hidden"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border dark:bg-slate-900 transition-transform lg:translate-x-0 lg:static",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full px-4 py-6">
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Target className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              GrupoBoost
            </h1>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <SidebarItem 
              icon={Target} 
              label="Campanhas" 
              active={activeTab === "campaigns"}
              onClick={() => setActiveTab("campaigns")}
            />
            <SidebarItem 
              icon={Users} 
              label="Leads" 
              active={activeTab === "leads"}
              onClick={() => setActiveTab("leads")}
            />
            <SidebarItem 
              icon={MessageSquare} 
              label="Mensagens" 
              active={activeTab === "messages"}
              onClick={() => setActiveTab("messages")}
            />
            <SidebarItem 
              icon={Settings} 
              label="Configurações" 
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
          </nav>

          <div className="pt-6 mt-6 border-t border-border">
            <SidebarItem icon={LogOut} label="Sair" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 backdrop-blur-md border-bottom border-border dark:bg-slate-900/80">
          <h2 className="text-lg font-semibold capitalize">
            {activeTab}
          </h2>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              Novo Bot
            </Button>
            <div className="w-8 h-8 rounded-full bg-slate-200" />
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
