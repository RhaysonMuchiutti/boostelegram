import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Link as LinkIcon, Palette, Bot } from "lucide-react";

export const CampaignForm = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 h-full overflow-y-auto pr-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Criar Nova Campanha</h2>
        <Button>Salvar Campanha</Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="gap-2">
            <Target className="w-4 h-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Palette className="w-4 h-4" /> Conteúdo
          </TabsTrigger>
          <TabsTrigger value="bot" className="gap-2">
            <Bot className="w-4 h-4" /> Bot & Grupos
          </TabsTrigger>
          <TabsTrigger value="tracking" className="gap-2">
            <LinkIcon className="w-4 h-4" /> UTM & Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Campanha</Label>
                <Input id="name" placeholder="Ex: Lançamento Março 2024" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="niche">Nicho</Label>
                <Input id="niche" placeholder="Ex: Marketing Digital, Saúde, Investimentos" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">URL da Landing Page</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                    grupoboost.com/c/
                  </span>
                  <Input id="slug" placeholder="minha-campanha-exclusiva" className="flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Personalização da Landing Page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título Principal (H1)</Label>
                <Input id="title" placeholder="A promessa irresistível do seu grupo" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Textarea id="subtitle" placeholder="Explique por que eles devem entrar agora mesmo" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cta">Texto do Botão</Label>
                <Input id="cta" placeholder="Quero entrar pelo Telegram" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bot">
          <Card>
            <CardHeader>
              <CardTitle>Integração com Telegram</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="bot-token">Token do Bot (via @BotFather)</Label>
                <Input id="bot-token" type="password" placeholder="123456789:ABCdefGHIjkl..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group-link">Link do Grupo Principal</Label>
                <Input id="group-link" placeholder="https://t.me/seu_grupo" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Rastreamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="utm_source">UTM Source Padrão</Label>
                  <Input id="utm_source" placeholder="facebook, instagram, google" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="utm_medium">UTM Medium Padrão</Label>
                  <Input id="utm_medium" placeholder="ads, stories, linktree" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
