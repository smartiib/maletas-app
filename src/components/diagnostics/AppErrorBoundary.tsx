
import React from 'react';
import { logger } from '@/services/logger';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Atualiza estado para próxima renderização
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    logger.error('ReactErrorBoundary', error?.message || 'Erro de renderização', {
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // Não alterar UI do app: renderiza nada (apenas registra)
      return null;
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
