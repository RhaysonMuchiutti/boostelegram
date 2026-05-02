import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  MousePointer2, 
  MessageCircle, 
  TrendingUp,
  Target,
  BarChart3
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
}

const MetricCard = ({ title, value, description, icon: Icon, trend }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {description}
        {trend && <span className="ml-1 text-emerald-500 font-medium">{trend}</span>}
      </p>
    </CardContent>
  </Card>
);

export const DashboardView = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Leads"
          value="1,284"
          description="Captação total"
          icon={Users}
          trend="+12%"
        />
        <MetricCard
          title="Taxa de Conversão"
          value="32.4%"
          description="Landing page para Bot"
          icon={MousePointer2}
        />
        <MetricCard
          title="Entrada no Grupo"
          value="85%"
          description="Conversão final"
          icon={MessageCircle}
          trend="+5%"
        />
        <MetricCard
          title="Campanhas Ativas"
          value="12"
          description="Rodando agora"
          icon={Target}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Crescimento de Leads</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg m-2">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>Gráfico de evolução será renderizado aqui</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Leads por Nicho</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg m-2">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>Distribuição por interesse</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
