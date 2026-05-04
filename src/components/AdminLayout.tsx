import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  Key,
  List,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, collapsed, onClick }: SidebarItemProps) => {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg whitespace-nowrap overflow-hidden relative group",
        active 
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "px-3 justify-center"
      )}
    >
      {active && collapsed && (
        <div className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-r-full" />
      )}
      <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-200", active && collapsed && "scale-110")} />
      {!collapsed && <span>{label}</span>}
      {active && !collapsed && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children, activeTab, setActiveTab }: AdminLayoutProps & { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden fixed inset-0">
      {/* Mobile Menu Trigger */}
      <Button
        variant="outline"
        size="icon"
        className="fixed z-50 top-3 left-4 md:hidden bg-white shadow-sm border-slate-200"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu className="w-6 h-6 text-primary" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-border dark:bg-slate-900 transition-all duration-300 shrink-0 h-screen sticky top-0 z-40",
          "hidden md:block", // Always visible and pushing on desktop/tablet
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex flex-col h-full px-4 py-6">
          <div className="flex items-center justify-between gap-3 px-2 mb-8">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground flex-shrink-0">
                <Target className="w-6 h-6" />
              </div>
              {!isCollapsed && (
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  GrupoBoost
                </h1>
              )}
            </div>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="flex shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 shadow-sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCollapsed(!isCollapsed);
                  }}
                >
                  {isCollapsed ? <PanelLeftOpen className="w-5 h-5 text-primary" /> : <PanelLeftClose className="w-5 h-5 text-primary" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expandir menu" : "Recolher menu"}
              </TooltipContent>
            </Tooltip>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === "dashboard"}
              collapsed={isCollapsed}
              onClick={() => setActiveTab("dashboard")}
            />
            <SidebarItem 
              icon={Target} 
              label="Campanhas" 
              active={activeTab === "campaigns"}
              collapsed={isCollapsed}
              onClick={() => setActiveTab("campaigns")}
            />
            <SidebarItem 
              icon={Users} 
              label="Leads" 
              active={activeTab === "leads"}
              collapsed={isCollapsed}
              onClick={() => setActiveTab("leads")}
            />
            <SidebarItem 
              icon={MessageSquare} 
              label="Chat" 
              active={activeTab === "messages"}
              collapsed={isCollapsed}
              onClick={() => setActiveTab("messages")}
            />
            <SidebarItem 
              icon={Zap} 
              label="Automação" 
              active={activeTab === "automation"}
              collapsed={isCollapsed}
              onClick={() => setActiveTab("automation")}
            />
            <SidebarItem 
              icon={List} 
              label="Gerenciar Grupos" 
              active={activeTab === "group-manager"}
              collapsed={isCollapsed}
              onClick={() => setActiveTab("group-manager")}
            />
            <SidebarItem 
              icon={Settings} 
              label="Configurações" 
              active={activeTab === "settings"}
              collapsed={isCollapsed}
              onClick={() => setActiveTab("settings")}
            />
            <SidebarItem 
              icon={Key} 
              label="Telegram API" 
              active={activeTab === "telegram-api"}
              collapsed={isCollapsed}
              onClick={() => setActiveTab("telegram-api")}
            />
          </nav>

          <div className="pt-4 space-y-2 mt-auto border-t border-border">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "px-3 justify-center"
              )}
              title={isCollapsed ? "Expandir" : "Recolher"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              {!isCollapsed && <span>Recolher Menu</span>}
            </button>
            <SidebarItem icon={LogOut} label="Sair" collapsed={isCollapsed} />
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay for small screens) */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm md:hidden transition-opacity duration-300",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 md:hidden transition-transform duration-300 border-r border-border",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* We can reuse the sidebar content here or just copy it, for simplicity I'll keep it separate or use a component */}
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
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "dashboard"} onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }} />
            <SidebarItem icon={Target} label="Campanhas" active={activeTab === "campaigns"} onClick={() => { setActiveTab("campaigns"); setIsSidebarOpen(false); }} />
            <SidebarItem icon={Users} label="Leads" active={activeTab === "leads"} onClick={() => { setActiveTab("leads"); setIsSidebarOpen(false); }} />
            <SidebarItem icon={MessageSquare} label="Mensagens" active={activeTab === "messages"} onClick={() => { setActiveTab("messages"); setIsSidebarOpen(false); }} />
            <SidebarItem icon={List} label="Gerenciar Grupos" active={activeTab === "group-manager"} onClick={() => { setActiveTab("group-manager"); setIsSidebarOpen(false); }} />
            <SidebarItem icon={Settings} label="Configurações" active={activeTab === "settings"} onClick={() => { setActiveTab("settings"); setIsSidebarOpen(false); }} />
          </nav>
          <div className="pt-6 mt-6 border-t border-border">
            <SidebarItem icon={LogOut} label="Sair" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 md:h-16 px-4 md:px-6 bg-white/80 backdrop-blur-md border-b border-border dark:bg-slate-900/80 shrink-0">
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
        <div className="flex-1 p-2 sm:p-4 md:p-6 min-h-0 overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};
