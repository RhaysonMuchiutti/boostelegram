import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  MessageCircle, 
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  FileDown,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  className?: string;
  iconClassName?: string;
}

const MetricCard = ({ title, value, description, icon: Icon, className, iconClassName }: MetricCardProps) => (
  <Card className={cn("overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md", className)}>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-slate-50/50">
      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      <div className={cn("p-2 rounded-lg bg-white shadow-sm", iconClassName)}>
        <Icon className="w-4 h-4" />
      </div>
    </CardHeader>
    <CardContent className="pt-4">
      <div className="text-2xl font-black tracking-tight">{value}</div>
      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
        {description}
      </p>
    </CardContent>
  </Card>
);

export const DashboardView = () => {
  const [stats, setStats] = useState({
    totalAdded: 0,
    totalFailed: 0,
    totalTasks: 0,
    activeTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all tasks for stats
      const { data: allTasks } = await supabase
        .from('import_tasks')
        .select('status, added_count, failed_count')
        .eq('user_id', user.id);

      if (allTasks) {
        const aggregated = allTasks.reduce((acc, curr) => {
          acc.totalAdded += curr.added_count || 0;
          acc.totalFailed += curr.failed_count || 0;
          acc.totalTasks += 1;
          if (curr.status === 'processing' || curr.status === 'pending') {
            acc.activeTasks += 1;
          }
          return acc;
        }, { totalAdded: 0, totalFailed: 0, totalTasks: 0, activeTasks: 0 });
        
        setStats(aggregated);
      }

      // Fetch 5 most recent tasks
      const { data: recent } = await supabase
        .from('import_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentTasks(recent || []);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-2 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Visão Geral
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
          </h2>
          <p className="text-muted-foreground text-sm">Resumo de suas atividades e automações do Telegram.</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Membros Adicionados"
          value={stats.totalAdded.toLocaleString()}
          description="Total processado com sucesso"
          icon={Users}
          iconClassName="text-green-600"
        />
        <MetricCard
          title="Falhas na Importação"
          value={stats.totalFailed.toLocaleString()}
          description="Membros que não puderam ser adicionados"
          icon={XCircle}
          iconClassName="text-red-600"
        />
        <MetricCard
          title="Tarefas Ativas"
          value={stats.activeTasks}
          description="Processamentos em segundo plano agora"
          icon={RefreshCw}
          iconClassName="text-blue-600"
          className={stats.activeTasks > 0 ? "border-blue-200 bg-blue-50/10" : ""}
        />
        <MetricCard
          title="Total de Tarefas"
          value={stats.totalTasks}
          description="Histórico completo de importações"
          icon={CheckCircle2}
          iconClassName="text-slate-600"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-7 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Importações Recentes</CardTitle>
              <CardDescription>Acompanhe o status das suas últimas listas de membros.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-muted-foreground uppercase bg-slate-50/50 border-y border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-bold">Status</th>
                    <th className="px-6 py-3 font-bold">Grupo de Destino</th>
                    <th className="px-6 py-3 font-bold">Progresso</th>
                    <th className="px-6 py-3 font-bold">Sucesso/Erro</th>
                    <th className="px-6 py-3 font-bold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTasks.length > 0 ? (
                    recentTasks.map((task) => (
                      <tr key={task.id} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {task.status === 'processing' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                            {task.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                            {task.status === 'stopped' && <PauseCircle className="w-4 h-4 text-amber-500" />}
                            {task.status === 'pending' && <Clock className="w-4 h-4 text-slate-400" />}
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-full",
                              task.status === 'completed' ? "bg-green-100 text-green-700" :
                              task.status === 'processing' ? "bg-blue-100 text-blue-700" :
                              task.status === 'failed' ? "bg-red-100 text-red-700" :
                              task.status === 'stopped' ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-600"
                            )}>
                              {task.status === 'completed' ? 'Concluído' :
                               task.status === 'processing' ? 'Processando' :
                               task.status === 'failed' ? 'Falhou' :
                               task.status === 'stopped' ? 'Pausado' :
                               'Pendente'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {task.group_title || "Grupo sem título"}
                          <div className="text-[10px] font-mono text-muted-foreground opacity-50">ID: {task.group_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 w-32">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span>{Math.round((task.processed_count / task.total_count) * 100)}%</span>
                              <span>{task.processed_count}/{task.total_count}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  task.status === 'completed' ? "bg-green-500" :
                                  task.status === 'failed' ? "bg-red-500" :
                                  "bg-primary"
                                )}
                                style={{ width: `${(task.processed_count / task.total_count) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 text-xs">
                            <span className="text-green-600 font-bold">{task.added_count} S</span>
                            <span className="text-red-600 font-bold">{task.failed_count} F</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                          {new Date(task.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-10" />
                        <p className="text-sm">Nenhuma importação encontrada.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
