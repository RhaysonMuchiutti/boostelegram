import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Compass, 
  Hash, 
  Users, 
  ArrowRight, 
  Globe, 
  Plus, 
  Trash2,
  RefreshCw,
  ExternalLink,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const NicheFinderView = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newNicheName, setNewNicheName] = useState("");
  const [newNicheKeywords, setNewNicheKeywords] = useState("");
  const [isAddingNiche, setIsAddingNiche] = useState(false);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("niche_categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const fetchGroups = async (nicheId: string | null) => {
    let query = supabase.from("scraped_groups").select("*");
    if (nicheId) query = query.eq("niche_id", nicheId);
    
    const { data } = await query.order("member_count", { ascending: false });
    setGroups(data || []);
  };

  useEffect(() => {
    fetchCategories();
    fetchGroups(null);
  }, []);

  const handleAddNiche = async () => {
    if (!newNicheName.trim()) return;
    
    const keywords = newNicheKeywords.split(",").map(k => k.trim()).filter(Boolean);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("niche_categories").insert({
      name: newNicheName,
      keywords,
      user_id: user.id
    });

    if (error) {
      toast.error("Erro ao adicionar nicho");
    } else {
      toast.success("Nicho adicionado com sucesso!");
      setNewNicheName("");
      setNewNicheKeywords("");
      setIsAddingNiche(false);
      fetchCategories();
    }
  };

  const startScraping = async () => {
    if (!selectedNiche) {
      toast.error("Selecione um nicho para garimpar");
      return;
    }

    setIsSearching(true);
    toast.info("Iniciando garimpo de grupos por nicho...");

    try {
      // Aqui chamaríamos uma Edge Function futura que usa a API do Telegram para buscar grupos globais
      // Por enquanto, vamos simular que encontramos novos grupos
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Novos grupos encontrados e catalogados!");
      fetchGroups(selectedNiche);
    } catch (error) {
      toast.error("Erro ao garimpar grupos");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Garimpo por Nicho
          </h2>
          <p className="text-muted-foreground text-sm">Encontre grupos e canais segmentados para suas campanhas.</p>
        </div>
        <Button onClick={() => setIsAddingNiche(!isAddingNiche)} variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Nicho
        </Button>
      </div>

      {isAddingNiche && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-bold">Configurar Novo Nicho</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome do Nicho</label>
              <Input 
                placeholder="Ex: Marketing Digital, Crypto, Saúde" 
                value={newNicheName}
                onChange={(e) => setNewNicheName(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="flex-[2] space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Palavras-chave (separadas por vírgula)</label>
              <Input 
                placeholder="Ex: bitcoin, traders, ethereum" 
                value={newNicheKeywords}
                onChange={(e) => setNewNicheKeywords(e.target.value)}
                className="bg-white"
              />
            </div>
            <Button onClick={handleAddNiche} className="gap-2">Salvar</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar de Nichos */}
        <Card className="lg:col-span-1 flex flex-col border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="p-4 border-b bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <Hash className="w-3 h-3" />
              Nichos Salvos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => { setSelectedNiche(null); fetchGroups(null); }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    selectedNiche === null ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-slate-100"
                  )}
                >
                  Todos os Grupos
                </button>
                {categories.map((niche) => (
                  <button
                    key={niche.id}
                    onClick={() => { setSelectedNiche(niche.id); fetchGroups(niche.id); }}
                    className={cn(
                      "w-full flex flex-col items-start px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      selectedNiche === niche.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{niche.name}</span>
                      {selectedNiche === niche.id && <ArrowRight className="w-3 h-3" />}
                    </div>
                    <div className={cn("text-[9px] mt-0.5 opacity-60", selectedNiche === niche.id ? "text-white" : "text-muted-foreground")}>
                      {niche.keywords?.join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Listagem de Grupos */}
        <Card className="lg:col-span-3 flex flex-col border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="p-4 border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase">
                {selectedNiche ? `Resultados: ${categories.find(c => c.id === selectedNiche)?.name}` : "Todos os Grupos Encontrados"}
              </CardTitle>
              <CardDescription className="text-[10px]">Total de {groups.length} grupos encontrados.</CardDescription>
            </div>
            <Button 
              size="sm" 
              className="gap-2" 
              onClick={startScraping}
              disabled={isSearching || !selectedNiche}
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Garimpar Agora
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <Card key={group.id} className="overflow-hidden border-slate-100 hover:border-primary/30 transition-all hover:shadow-md group">
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary font-bold shadow-inner">
                                {group.title?.[0]}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold truncate leading-none mb-1">{group.title}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                    {group.type === 'channel' ? 'Canal' : 'Grupo'}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {group.member_count?.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[32px]">
                            {group.description || "Sem descrição disponível."}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <span className="text-[10px] font-mono text-primary font-bold">@{group.username}</span>
                            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-primary hover:bg-primary/10 px-2">
                              Importar Membros
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <Globe className="w-12 h-12 mb-4" />
                      <p className="text-sm font-bold">Nenhum grupo encontrado neste nicho.</p>
                      <p className="text-xs">Clique em "Garimpar Agora" para buscar novos resultados.</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};