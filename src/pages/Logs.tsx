
import React, { useState } from 'react';
import { Search, Filter, Calendar, User, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LogEntry {
  id: number;
  action: string;
  module: 'products' | 'orders' | 'customers' | 'system';
  user: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

const Logs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('Todos');
  const [selectedLevel, setSelectedLevel] = useState('Todos');

  // Mock data - em produção viria do sistema de logs
  const logs: LogEntry[] = [
    {
      id: 1,
      action: 'PRODUCT_UPDATED',
      module: 'products',
      user: 'admin@loja.com',
      description: 'Produto iPhone 14 Pro atualizado',
      oldValue: 'Preço: R$ 5999,99',
      newValue: 'Preço: R$ 5799,99',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2024-01-15 14:30:25',
      level: 'info'
    },
    {
      id: 2,
      action: 'ORDER_STATUS_CHANGED',
      module: 'orders',
      user: 'vendedor@loja.com',
      description: 'Status do pedido #1001 alterado',
      oldValue: 'Status: pending',
      newValue: 'Status: processing',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      timestamp: '2024-01-15 14:25:12',
      level: 'success'
    },
    {
      id: 3,
      action: 'CUSTOMER_CREATED',
      module: 'customers',
      user: 'admin@loja.com',
      description: 'Novo cliente cadastrado: João Silva',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: '2024-01-15 14:15:08',
      level: 'success'
    },
    {
      id: 4,
      action: 'LOGIN_FAILED',
      module: 'system',
      user: 'unknown@email.com',
      description: 'Tentativa de login falhada',
      ipAddress: '203.0.113.1',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      timestamp: '2024-01-15 14:10:45',
      level: 'warning'
    },
    {
      id: 5,
      action: 'SYSTEM_ERROR',
      module: 'system',
      user: 'system',
      description: 'Erro na conexão com API do WooCommerce',
      ipAddress: '192.168.1.1',
      userAgent: 'Internal System',
      timestamp: '2024-01-15 13:45:22',
      level: 'error'
    }
  ];

  const modules = ['Todos', 'products', 'orders', 'customers', 'system'];
  const levels = ['Todos', 'info', 'success', 'warning', 'error'];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'Todos' || log.module === selectedModule;
    const matchesLevel = selectedLevel === 'Todos' || log.level === selectedLevel;
    return matchesSearch && matchesModule && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-success-100 text-success-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return <Activity className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getModuleLabel = (module: string) => {
    switch (module) {
      case 'products': return 'Produtos';
      case 'orders': return 'Pedidos';
      case 'customers': return 'Clientes';
      case 'system': return 'Sistema';
      default: return module;
    }
  };

  const getTotalLogs = () => logs.length;
  const getErrorLogs = () => logs.filter(l => l.level === 'error').length;
  const getWarningLogs = () => logs.filter(l => l.level === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Logs do Sistema
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Histórico completo de ações e eventos
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total de Logs
                </p>
                <p className="text-2xl font-bold">{getTotalLogs()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Avisos
                </p>
                <p className="text-2xl font-bold text-yellow-600">{getWarningLogs()}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Erros
                </p>
                <p className="text-2xl font-bold text-red-600">{getErrorLogs()}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar logs por descrição, usuário ou ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-background"
              >
                {modules.map(module => (
                  <option key={module} value={module}>
                    {module === 'Todos' ? 'Todos' : getModuleLabel(module)}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-background"
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level === 'Todos' ? 'Todos' : level.toUpperCase()}
                  </option>
                ))}
              </select>
              
              <Button variant="outline">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Histórico de Logs ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Alterações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <TableCell className="font-mono text-sm">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <Badge className={getLevelColor(log.level)}>
                      <div className="flex items-center gap-1">
                        {getLevelIcon(log.level)}
                        {log.level.toUpperCase()}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getModuleLabel(log.module)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.description}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        IP: {log.ipAddress}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.oldValue && log.newValue && (
                      <div className="text-xs space-y-1">
                        <div className="text-red-600">Anterior: {log.oldValue}</div>
                        <div className="text-success-600">Novo: {log.newValue}</div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;
