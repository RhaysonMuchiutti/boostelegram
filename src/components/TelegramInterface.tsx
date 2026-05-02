import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  MoreVertical, 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video,
  User,
  Users,
  Zap,
  QrCode,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

export const TelegramInterface = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("telegram_connections")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        setIsConnected(data?.status === "connected");
      } catch (err) {
        console.error("Erro ao verificar conexão:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkConnection();
  }, []);

  const chats = [
    { id: 1, name: "Grupo de Tráfego VIP", lastMsg: "Sejam bem-vindos!", time: "14:20", unread: 5, isGroup: true, members: "5.234", online: "412" },
    { id: 2, name: "João Silva", lastMsg: "Opa, como funciona o bot?", time: "12:05", unread: 0, isGroup: false },
    { id: 3, name: "Comunidade Renda Extra", lastMsg: "Novo conteúdo disponível", time: "Ontem", unread: 0, isGroup: true, members: "1.500", online: "89" },
    { id: 4, name: "Suporte GrupoBoost", lastMsg: "Sua conta foi ativada", time: "Segunda", unread: 1, isGroup: false },
  ];

  const currentChat = chats.find(c => c.id === selectedChat);

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {!isConnected && !isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-6 animate-bounce">
            <QrCode className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Telegram Não Conectado</h3>
          <p className="text-slate-500 max-w-md mb-8">
            Para visualizar e responder seus chats em tempo real, você precisa primeiro vincular sua conta do Telegram.
          </p>
          <div className="flex gap-4">
            <Button className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20">
              Vincular Agora
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar de Chats */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-10 bg-slate-50 dark:bg-slate-800 border-none h-10" placeholder="Pesquisar..." />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => setSelectedChat(chat.id)}
              className={cn(
                "flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800",
                selectedChat === chat.id && "bg-blue-50/50 dark:bg-blue-900/20"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0",
                chat.isGroup ? "bg-blue-500" : "bg-emerald-500"
              )}>
                {chat.isGroup ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-semibold text-sm truncate">{chat.name}</h4>
                  <span className="text-[10px] text-slate-400">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 truncate">{chat.lastMsg}</p>
                  {chat.unread > 0 && (
                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Janela de Chat */}
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/50">
        {currentChat ? (
          <>
            <header className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0",
                  currentChat.isGroup ? "bg-blue-500" : "bg-emerald-500"
                )}>
                  {currentChat.isGroup ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{currentChat.name}</h4>
                  {currentChat.isGroup ? (
                    <p className="text-[10px] text-emerald-500 font-medium">{currentChat.members} membros, {currentChat.online} online</p>
                  ) : (
                    <p className="text-[10px] text-emerald-500 font-medium">Online</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[10px] font-bold border border-amber-100 dark:border-amber-900/30 animate-pulse">
                  <Zap className="w-3 h-3" /> AUTOMAÇÃO ATIVA
                </div>
                <Phone className="w-5 h-5 cursor-pointer hover:text-slate-600" />
                <Video className="w-5 h-5 cursor-pointer hover:text-slate-600" />
                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
                <MoreVertical className="w-5 h-5 cursor-pointer hover:text-slate-600" />
              </div>
            </header>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="flex justify-center">
                <span className="bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-3 py-1 rounded-full font-medium">
                  HOJE
                </span>
              </div>

              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700">
                  <p className="text-sm">Sejam bem-vindos ao grupo oficial de Tráfego VIP! Aqui vamos compartilhar as melhores estratégias.</p>
                  <span className="text-[10px] text-slate-400 block text-right mt-1">14:20</span>
                </div>
              </div>

              <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center text-[10px] text-white font-bold">
                  EU
                </div>
                <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none shadow-sm">
                  <p className="text-sm">Obrigado! Pronto para começar.</p>
                  <span className="text-[10px] text-white/70 block text-right mt-1">14:25</span>
                </div>
              </div>
            </div>

            <footer className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 max-w-4xl mx-auto">
                <Paperclip className="w-6 h-6 text-slate-400 cursor-pointer hover:text-primary" />
                <div className="flex-1 relative">
                  <Input className="bg-slate-50 dark:bg-slate-800 border-none h-11 pr-12" placeholder="Escreva uma mensagem..." />
                  <Smile className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 cursor-pointer hover:text-primary" />
                </div>
                <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                  <Send className="w-5 h-5" />
                </div>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p>Selecione um chat para começar a conversar</p>
          </div>
        )}
      </div>
    </div>
  );
};
