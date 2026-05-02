import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  MessageSquare,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as ReactWindow from "react-window";
import { AutoSizer } from "react-virtualized-auto-sizer";
const ListVirtual = (ReactWindow as any).VariableSizeList;
const AutoSizerComponent = AutoSizer as any;


export const TelegramInterface = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "pending_qr" | "disconnected" | "error">("disconnected");
  const [isLoading, setIsLoading] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [creds, setCreds] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef<number>(0);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  const listRef = useRef<any>(null);
  const rowHeights = useRef<{[key: number]: number}>({});

  const setRowHeight = (index: number, size: number) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  };

  const getRowHeight = (index: number) => {
    return rowHeights.current[index] || 100;
  };

  const init = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connection } = await supabase
        .from("telegram_connections")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      const status = (connection?.status as any) || "disconnected";
      setConnectionStatus(status);

      const { data: credentials } = await supabase
        .from("telegram_credentials")
        .select("api_id, api_hash")
        .eq("user_id", user.id)
        .maybeSingle();

      setCreds(credentials);
      
      if (status === "connected" && credentials) {
        fetchChats(credentials);
      }
    } catch (err) {
      console.error("Erro ao inicializar:", err);
      setConnectionStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const fetchChats = async (credentials: any) => {
    try {
      const { data, error } = await supabase.functions.invoke("telegram-connector", {
        body: { action: "get-chats", apiId: credentials.api_id, apiHash: credentials.api_hash }
      });
      if (!error && data?.chats) setChats(data.chats);
    } catch (err) {
      console.error("Erro ao buscar chats:", err);
    }
  };

  const fetchMessages = async (chatId: string, isLoadMore = false) => {
    if (!creds || (isLoadMore && (!hasMore || isLoadingMore))) return;
    
    if (isLoadMore) setIsLoadingMore(true);
    
    try {
      let offsetId;
      if (isLoadMore && messages.length > 0) {
        offsetId = messages[0].id;
      }
      
      const { data, error } = await supabase.functions.invoke("telegram-connector", {
        body: { 
          action: "get-messages", 
          apiId: creds.api_id, 
          apiHash: creds.api_hash,
          chatId,
          offsetId,
          limit: 30
        }
      });

      if (!error && data?.messages) {
        const newMsgs = data.messages.reverse();
        
        if (isLoadMore) {
          if (newMsgs.length < 30) setHasMore(false);
          if (scrollRef.current) {
            lastScrollHeight.current = scrollRef.current.scrollHeight;
          }
          setMessages(prev => [...newMsgs, ...prev]);
        } else {
          setMessages(newMsgs);
          setHasMore(true);
          setTimeout(() => {
            if (listRef.current) {
              listRef.current.scrollToItem(newMsgs.length - 1, "end");
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    } finally {
      if (isLoadMore) setIsLoadingMore(false);
    }
  };

  const pollNewMessages = async (chatId: string) => {
    if (!creds || !messages.length) return;
    
    try {
      const lastMessageId = messages[messages.length - 1].id;
      
      const { data, error } = await supabase.functions.invoke("telegram-connector", {
        body: { 
          action: "get-messages", 
          apiId: creds.api_id, 
          apiHash: creds.api_hash,
          chatId,
          limit: 10
        }
      });

      if (!error && data?.messages) {
        const incoming = data.messages.reverse();
        const onlyNew = incoming.filter((m: any) => m.id > lastMessageId);
        
        if (onlyNew.length > 0) {
          setMessages(prev => {
            const currentLastId = prev.length > 0 ? prev[prev.length - 1].id : 0;
            const strictlyNew = onlyNew.filter((m: any) => m.id > currentLastId);
            return [...prev, ...strictlyNew];
          });
          
          if (listRef.current) {
             // In virtualized list, we check offset instead of DOM scroll
             // But for simplicity let's just scroll if they were roughly at the end
             listRef.current.scrollToItem(messages.length + onlyNew.length - 1, "end");
          }
        }
      }
    } catch (err) {
      console.error("Erro no polling de mensagens:", err);
    }
  };

  useEffect(() => {
    if (isLoadingMore === false && lastScrollHeight.current > 0 && scrollRef.current) {
      // In virtualized list, we handle scroll restoration differently, 
      // but VariableSizeList handles some of this if we maintain the index.
    }
  }, [messages, isLoadingMore]);

  useEffect(() => {
    if (selectedChat) {
      setMessages([]);
      setHasMore(true);
      rowHeights.current = {};
      fetchMessages(selectedChat);
      const interval = setInterval(() => pollNewMessages(selectedChat), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !creds || isSending) return;
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("telegram-connector", {
        body: { 
          action: "send-message", 
          apiId: creds.api_id, 
          apiHash: creds.api_hash,
          chatId: selectedChat,
          message: newMessage
        }
      });
      if (!error) {
        setNewMessage("");
        fetchMessages(selectedChat);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleReconnect = () => {
    toast.info("Atualizando status da conexão...");
    init();
  };

  const fetchParticipants = async (chatId: string) => {
    if (!creds) return;
    setIsLoadingParticipants(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-connector", {
        body: { 
          action: "get-participants", 
          apiId: creds.api_id, 
          apiHash: creds.api_hash,
          chatId 
        }
      });
      if (!error && data?.participants) setParticipants(data.participants);
    } catch (err) {
      console.error("Erro ao buscar participantes:", err);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const currentChat = chats.find(c => c.id === selectedChat);

  const MessageRow = ({ index, style }: { index: number, style: any }) => {
    const msg = messages[index];
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.getBoundingClientRect().height + 24); // 24 for gap
      }
    }, [msg.text]);

    return (
      <div style={style}>
        <div ref={rowRef} className={cn("flex gap-3 max-w-[80%] mx-6 my-3", msg.fromMe ? "ml-auto flex-row-reverse" : "")}>
          <div className={cn("w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] text-white font-bold", msg.fromMe ? "bg-primary" : "bg-slate-200 dark:bg-slate-800")}>
            {msg.fromMe ? "EU" : <User className="w-4 h-4" />}
          </div>
          <div className={cn(
            "p-3 rounded-2xl shadow-sm border",
            msg.fromMe 
              ? "bg-primary text-white border-transparent rounded-tr-none" 
              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-tl-none"
          )}>
            <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
            <span className={cn("text-[10px] block text-right mt-1", msg.fromMe ? "text-white/70" : "text-slate-400")}>
              {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {connectionStatus !== "connected" && !isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce",
            connectionStatus === "pending_qr" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
          )}>
            <QrCode className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {connectionStatus === "pending_qr" ? "Aguardando QR Code" : "Telegram Desconectado"}
          </h3>
          <p className="text-slate-500 max-w-md mb-8">
            {connectionStatus === "pending_qr" 
              ? "Sua conexão está pendente. Finalize o escaneamento do QR Code nas configurações."
              : "Para visualizar e responder seus chats em tempo real, você precisa primeiro vincular sua conta do Telegram."}
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={handleReconnect}
              className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              {connectionStatus === "pending_qr" ? "Concluir Conexão" : "Vincular Agora"}
            </Button>
          </div>
        </div>
      )}

      <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === "connected" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                connectionStatus === "pending_qr" ? "bg-amber-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {connectionStatus === "connected" ? "Conectado" : 
                 connectionStatus === "pending_qr" ? "Pendente" : "Desconectado"}
              </span>
            </div>
            {connectionStatus !== "connected" && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-slate-400 hover:text-primary"
                onClick={handleReconnect}
                title="Sincronizar Status"
              >
                <Zap className="h-3 w-3" />
              </Button>
            )}
          </div>
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
                  <span className="text-[10px] text-slate-400">{chat.time ? new Date(chat.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}</span>
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
                    <p className="text-[10px] text-emerald-500 font-medium">{currentChat.members} membros</p>
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
                <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-slate-400 hover:text-primary"
                      onClick={() => currentChat && fetchParticipants(currentChat.id)}
                    >
                      <List className="w-5 h-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Membros do Grupo</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px] mt-4">
                      {isLoadingParticipants ? (
                        <div className="flex justify-center py-8">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-4 pr-4">
                          {participants.map((p) => (
                            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                {p.firstName?.[0] || "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">
                                  {p.firstName} {p.lastName} {p.isBot && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-1">BOT</span>}
                                </p>
                                {p.username && <p className="text-xs text-slate-400 truncate">@{p.username}</p>}
                              </div>
                              {p.phone && <p className="text-[10px] text-slate-400">{p.phone}</p>}
                            </div>
                          ))}
                          {participants.length === 0 && (
                            <p className="text-center text-slate-400 py-8 italic text-sm">Nenhum membro encontrado</p>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <MoreVertical className="w-5 h-5 cursor-pointer hover:text-slate-600" />
              </div>
            </header>

            <div className="flex-1 bg-slate-50/30 dark:bg-slate-900/50">
              <AutoSizerComponent>
                {({ height, width }: any) => (

                  <ListVirtual
                    ref={listRef}
                    height={height}
                    width={width}
                    itemCount={messages.length}
                    itemSize={getRowHeight}
                    onScroll={({ scrollOffset, scrollDirection }) => {
                      if (scrollDirection === "backward" && scrollOffset < 50 && !isLoadingMore && hasMore && selectedChat) {
                        fetchMessages(selectedChat, true);
                      }
                    }}
                  >
                    {MessageRow}
                  </ListVirtual>
                )}
              </AutoSizerComponent>
              {messages.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic text-sm pointer-events-none">
                  Nenhuma mensagem recente
                </div>
              )}
            </div>

            <footer className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 max-w-4xl mx-auto">
                <Paperclip className="w-6 h-6 text-slate-400 cursor-pointer hover:text-primary" />
                <div className="flex-1 relative">
                  <Input 
                    className="bg-slate-50 dark:bg-slate-800 border-none h-11 pr-12" 
                    placeholder="Escreva uma mensagem..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    disabled={isSending}
                  />
                  <Smile className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 cursor-pointer hover:text-primary" />
                </div>
                <Button 
                  size="icon"
                  disabled={isSending || !newMessage.trim()}
                  onClick={handleSendMessage}
                  className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                  <Send className="w-5 h-5" />
                </Button>
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
