
import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWooCommerceFilteredProducts } from '@/hooks/useWooCommerceFiltered';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Printer } from 'lucide-react';

type QueueItem = {
  id: string;
  name: string;
  sku?: string | null;
  image?: string | null;
  qty: number;
};

const Labels: React.FC = () => {
  const { data: products = [], isLoading } = useWooCommerceFilteredProducts();
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      return name.includes(term) || sku.includes(term);
    });
  }, [products, search]);

  const addToQueue = (p: any) => {
    setQueue((prev) => {
      const idx = prev.findIndex((i) => i.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          sku: p.sku,
          image: p.images?.[0]?.src || null,
          qty: 1,
        },
      ];
    });
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setQueue((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const handlePrint = () => {
    if (queue.length === 0) return;

    const html = `
      <html>
        <head>
          <title>Fila de Impressão - Etiquetas</title>
          <style>
            @page { margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Helvetica Neue', Arial, sans-serif; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
            .label { border: 1px solid #ddd; padding: 6px; border-radius: 6px; }
            .name { font-size: 10px; font-weight: 600; margin: 4px 0; }
            .sku { font-size: 9px; color: #666; }
          </style>
        </head>
        <body>
          <div class="grid">
            ${queue
              .map((item) =>
                Array.from({ length: item.qty })
                  .map(
                    () => `
                  <div class="label">
                    <div class="name">${item.name ?? ''}</div>
                    ${item.sku ? `<div class="sku">${item.sku}</div>` : ''}
                  </div>
                `
                  )
                  .join('')
              )
              .join('')}
          </div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
        </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Etiquetas</h1>
            <p className="text-muted-foreground">Selecione produtos para adicionar à fila de impressão</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="mb-4">
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {isLoading && (
                <div className="text-sm text-muted-foreground col-span-full">Carregando produtos...</div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="text-sm text-muted-foreground col-span-full">Nenhum produto encontrado.</div>
              )}
              {!isLoading &&
                filtered.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => addToQueue(p)}
                    className="text-left bg-card border rounded-md p-2 hover:bg-accent transition group"
                    title="Adicionar à fila"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded bg-muted">
                      {p.images?.[0]?.src ? (
                        <img
                          src={p.images[0].src}
                          alt={p.name}
                          className="w-full h-full object-cover grayscale opacity-70 group-hover:opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full grayscale opacity-70" />
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-xs font-semibold line-clamp-2">{p.name}</div>
                      {p.sku ? <div className="text-[10px] text-muted-foreground">{p.sku}</div> : null}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <div className="bg-card border rounded-md p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Fila de Impressão</h3>
              {queue.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setQueue([])}>
                  Limpar
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-2">
                {queue.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhum item na fila.</div>
                )}
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 border rounded p-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      {item.sku ? <div className="text-xs text-muted-foreground truncate">{item.sku}</div> : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => updateQty(item.id, -1)}>-</Button>
                      <div className="w-8 text-center text-sm">{item.qty}</div>
                      <Button variant="outline" size="sm" onClick={() => updateQty(item.id, 1)}>+</Button>
                      <Button variant="ghost" size="icon" onClick={() => removeFromQueue(item.id)} aria-label="Remover">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button
              className="mt-3 w-full"
              onClick={handlePrint}
              disabled={queue.length === 0}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir fila
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Labels;

