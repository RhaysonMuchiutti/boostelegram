import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Plus, 
  Trash2, 
  RefreshCw,
  Search,
  Settings,
  MoreVertical,
  ChevronRight,
  Shield,
  Zap,
  Info,
  FileDown,
  FileText,
  Table
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const GroupManagerView = () => {
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creds, setCreds] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importList, setImportList] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const init = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: credentials } = await supabase
        .from("telegram_credentials")
        .select("api_id, api_hash")
        .eq("user_id", user.id)
        .maybeSingle();

      setCreds(credentials);
      
      if (credentials) {
        await fetchMyGroups(credentials);
      }
    } catch (err) {
      console.error("Erro ao inicializar:", err);
      toast.error("Erro ao carregar dados do Telegram");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const fetchMyGroups = async (credentials: any) => {
    try {
      const { data, error } = await supabase.functions.invoke("telegram-connector", {
        body: { action: "get-my-groups", apiId: credentials.api_id, apiHash: credentials.api_hash }
      });
      if (!error && data?.groups) {
        setMyGroups(data.groups);
      } else if (error) {
        console.error("Erro ao buscar meus grupos:", error);
      }
    } catch (err) {
      console.error("Erro ao buscar meus grupos:", err);
    }
  };

  const fetchParticipants = async (groupId: string) => {
    if (!creds) return;
    setIsLoadingParticipants(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-connector", {
        body: { 
          action: "get-participants", 
          apiId: creds.api_id, 
          apiHash: creds.api_hash,
          chatId: groupId 
        }
      });
      if (!error && data?.participants) {
        setParticipants(data.participants);
      }
    } catch (err) {
      console.error("Erro ao buscar participantes:", err);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const handleImportMembers = async () => {
    if (!importList.trim() || !creds || !selectedGroup) return;
    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-connector", {
        body: { 
          action: "add-members", 
          apiId: creds.api_id, 
          apiHash: creds.api_hash,
          groupId: selectedGroup.id,
          participantsList: importList
        }
      });
      
      if (!error && data?.results) {
        const added = data.results.filter((r: any) => r.status === 'added').length;
        const errors = data.results.filter((r: any) => r.status === 'error').length;
        toast.success(`Processo finalizado: ${added} membros adicionados.`);
        if (errors > 0) toast.error(`${errors} membros falharam.`);
        setImportList("");
        setIsImportOpen(false);
        fetchParticipants(selectedGroup.id);
      }
    } catch (err) {
      console.error("Erro ao importar membros:", err);
      toast.error("Falha na importação.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = () => {
    if (participants.length === 0) {
      toast.error("Não há participantes para exportar.");
      return;
    }

    const headers = ["ID", "Nome", "Sobrenome", "Username"];
    const csvContent = [
      headers.join(","),
      ...participants.map(p => [
        p.id,
        `"${p.firstName || ""}"`,
        `"${p.lastName || ""}"`,
        p.username ? `@${p.username}` : ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `participantes_${selectedGroup?.title || "grupo"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado com sucesso!");
  };

  const handleExportPDF = () => {
    if (participants.length === 0) {
      toast.error("Não há participantes para exportar.");
      return;
    }

    const doc = new jsPDF();
    const tableColumn = ["ID", "Nome", "Username"];
    const tableRows = participants.map(p => [
      p.id,
      `${p.firstName || ""} ${p.lastName || ""}`.trim(),
      p.username ? `@${p.username}` : "N/A"
    ]);

    doc.text(`Participantes - ${selectedGroup?.title || "Grupo"}`, 14, 15);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`participantes_${selectedGroup?.title || "grupo"}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  const filteredGroups = myGroups.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciar Grupos e Canais</h2>
          <p className="text-muted-foreground">Visualize e gerencie os grupos onde você é proprietário ou administrador.</p>
        </div>
        <Button onClick={() => creds && fetchMyGroups(creds)} variant="outline" size="icon">
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
        <Card className="md:col-span-1 flex flex-col min-h-0 overflow-hidden shadow-sm border-slate-200">
          <CardHeader className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                    </div>
                  ))
                ) : filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedGroup(group);
                        fetchParticipants(group.id);
                      }}
                      className={cn(
                        "w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group",
                        selectedGroup?.id === group.id && "bg-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-sm truncate">{group.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {group.participantsCount} membros • {group.isChannel ? "Canal" : "Grupo"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        selectedGroup?.id === group.id && "translate-x-1"
                      )} />
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum grupo encontrado.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col min-h-0 overflow-hidden shadow-sm border-slate-200">
          {selectedGroup ? (
            <>
              <CardHeader className="p-6 border-b flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{selectedGroup.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      {selectedGroup.isCreator ? "Proprietário" : "Administrador"} • {selectedGroup.isChannel ? "Canal" : "Grupo"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Adicionar Membros
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Adicionar Membros</DialogTitle>
                        <CardDescription>
                          Cole usernames (ex: @usuario) ou IDs, separados por vírgula ou linha.
                          O sistema aplicará um delay automático para segurança.
                        </CardDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="members">Membros</Label>
                          <Textarea
                            id="members"
                            placeholder="@usuario1, @usuario2, 12345678"
                            className="min-h-[200px]"
                            value={importList}
                            onChange={(e) => setImportList(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs">
                          <Zap className="w-4 h-4 shrink-0" />
                          <span>Delays configurados: 15-30s por usuário, 30s extra a cada 5 usuários.</span>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
                        <Button onClick={handleImportMembers} disabled={isImporting || !importList.trim()}>
                          {isImporting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                              Adicionando...
                            </>
                          ) : (
                            "Iniciar Adição"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-red-600 gap-2">
                        <Trash2 className="w-4 h-4" />
                        Sair do Grupo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Participantes ({participants.length})
                      </h4>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <FileDown className="w-3 h-3" />
                              Exportar
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
                              <Table className="w-4 h-4" />
                              Exportar CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                              <FileText className="w-4 h-4" />
                              Exportar PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="sm" onClick={() => fetchParticipants(selectedGroup.id)}>
                          <RefreshCw className={cn("w-3 h-3 mr-2", isLoadingParticipants && "animate-spin")} />
                          Atualizar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {isLoadingParticipants ? (
                        Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 border border-slate-50 rounded-lg animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-slate-100"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                              <div className="h-3 bg-slate-50 rounded w-1/4"></div>
                            </div>
                          </div>
                        ))
                      ) : participants.length > 0 ? (
                        participants.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                {p.firstName?.[0] || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{p.firstName} {p.lastName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {p.username ? `@${p.username}` : "Sem username"}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500 font-medium">Nenhum participante encontrado ou sem permissão para listar.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-primary/5 flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Selecione um Grupo</h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                Escolha um grupo ou canal na lista ao lado para ver detalhes e gerenciar membros.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};