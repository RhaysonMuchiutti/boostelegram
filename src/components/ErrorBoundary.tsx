import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4 bg-red-50/50 rounded-xl border border-red-100">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-red-900">Algo deu errado</h2>
            <p className="text-sm text-red-700 max-w-md mx-auto">
              Ocorreu um erro inesperado na interface. Tente recarregar a página ou voltar para o início.
            </p>
            {this.state.error && (
              <pre className="mt-4 p-3 bg-red-950 text-red-200 text-[10px] rounded-lg text-left overflow-auto max-w-full">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <Button 
            onClick={this.handleReset}
            variant="outline" 
            className="border-red-200 text-red-700 hover:bg-red-100 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Recarregar Aplicativo
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
