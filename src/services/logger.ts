
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

  public log(level: LogEntry['level'], action: string, details: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      action,
      details,
      metadata,
    };

    this.logs.push(entry);
    this.saveLogs();
    
    // Log no console para debug
    console.log(`[${level.toUpperCase()}] ${action}: ${details}`, metadata);
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
}

export const logger = new Logger();
