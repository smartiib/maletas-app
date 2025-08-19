
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  action: string;
  details: string;
  user?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  // Referências originais do console para evitar loops de logging
  private originalConsole: {
    log: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
  } | null = null;

  private currentUser?: string;
  private timers = new Map<string, number>();
  private consoleCaptured = false;
  private globalErrorsCaptured = false;

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    const savedLogs = localStorage.getItem('woocommerce_logs');
    if (savedLogs) {
      this.logs = JSON.parse(savedLogs);
    }
  }

  private saveLogs() {
    // Manter apenas os últimos logs para não sobrecarregar o localStorage
    const recentLogs = this.logs.slice(-this.maxLogs);
    localStorage.setItem('woocommerce_logs', JSON.stringify(recentLogs));
    this.logs = recentLogs;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public setUser(userIdOrEmail?: string | null) {
    this.currentUser = userIdOrEmail || undefined;
  }

  private safeStringify(value: any) {
    try {
      if (typeof value === 'string') return value;
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  public log(level: LogEntry['level'], action: string, details: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      action,
      details,
      user: this.currentUser,
      metadata,
    };

    this.logs.push(entry);
    this.saveLogs();
    
    // Log no console para debug - sempre usar referência original para evitar recursão
    const out = this.originalConsole?.log ?? console.log;
    out(`[${level.toUpperCase()}] ${action}: ${details}`, metadata);
  }

  public info(action: string, details: string, metadata?: Record<string, any>) {
    this.log('info', action, details, metadata);
  }

  public warning(action: string, details: string, metadata?: Record<string, any>) {
    this.log('warning', action, details, metadata);
  }

  public error(action: string, details: string, metadata?: Record<string, any>) {
    this.log('error', action, details, metadata);
  }

  public success(action: string, details: string, metadata?: Record<string, any>) {
    this.log('success', action, details, metadata);
  }

  public getLogs(limit?: number): LogEntry[] {
    const logs = [...this.logs].reverse(); // Mais recentes primeiro
    return limit ? logs.slice(0, limit) : logs;
  }

  public getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level).reverse();
  }

  public clearLogs() {
    this.logs = [];
    localStorage.removeItem('woocommerce_logs');
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Captura global de console.* e envia para o logger
  public captureConsole() {
    if (this.consoleCaptured) return;
    this.consoleCaptured = true;

    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
    };

    const wrap =
      (method: 'log' | 'info' | 'warn' | 'error' | 'debug') =>
      (...args: any[]) => {
        // Sempre imprimir como o console faria
        this.originalConsole?.[method](...args);

        // Evitar logar os próprios logs do logger (heurística simples)
        const flat = args.map(a => this.safeStringify(a)).join(' ');
        const metadata = { args };

        if (method === 'error') {
          this.error('console.error', flat, metadata);
        } else if (method === 'warn') {
          this.warning('console.warn', flat, metadata);
        } else {
          this.info(`console.${method === 'log' ? 'log' : method}`, flat, metadata);
        }
      };

    console.log = wrap('log') as any;
    console.info = wrap('info') as any;
    console.warn = wrap('warn') as any;
    console.error = wrap('error') as any;
    console.debug = wrap('debug') as any;

    // Registrar ativação
    this.info('Diagnostics', 'Console capture enabled');
  }

  // Captura erros globais (runtime e promessas não tratadas)
  public captureGlobalErrors() {
    if (this.globalErrorsCaptured) return;
    this.globalErrorsCaptured = true;

    window.addEventListener('error', (event) => {
      const { message, filename, lineno, colno, error } = event;
      this.error('GlobalError', message || 'Erro global', {
        filename,
        lineno,
        colno,
        stack: error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason: any = (event as any).reason;
      const message =
        typeof reason === 'string'
          ? reason
          : reason?.message || 'Unhandled promise rejection';
      this.error('UnhandledRejection', message, {
        reason: this.safeStringify(reason),
        stack: reason?.stack,
      });
    });

    this.info('Diagnostics', 'Global error handlers enabled');
  }

  // Utilitário: medir tempo de operações
  public startTimer(label: string) {
    const id = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.timers.set(id, performance.now());
    return id;
  }

  public endTimer(timerId: string, action = 'Timer', extra?: Record<string, any>) {
    const start = this.timers.get(timerId);
    if (start !== undefined) {
      const duration = performance.now() - start;
      this.success(action, `Concluído em ${Math.round(duration)}ms`, {
        duration,
        timerId,
        ...(extra || {}),
      });
      this.timers.delete(timerId);
    } else {
      this.warning('Timer', 'Timer não encontrado ao finalizar', { timerId });
    }
  }

  public navigation(pathname: string, search?: string, extra?: Record<string, any>) {
    this.info('Navigation', `Rota: ${pathname}${search || ''}`, extra);
  }
}

export const logger = new Logger();
