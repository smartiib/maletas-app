
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast as sonnerToast } from 'sonner';

interface DbVariation {
  id: number;
  parent_id: number;
  sku?: string | null;
  price?: number | string | null;
  regular_price?: number | string | null;
  sale_price?: number | string | null;
  stock_quantity?: number | null;
  stock_status?: string | null;
  attributes?: Array<any> | null;
  image?: any | null;
  description?: string | null;
}

// Minimal Product shape used in this page
interface Product {
  id: number | string;
  type?: string | null;
  name: string;
  images?: { src: string }[];
  description?: string | null;
  price?: number | string | null;
  regular_price?: number | string | null;
  sale_price?: number | string | null;
}

const POS = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawProductId = searchParams.get('productId');
  const productId = rawProductId ? Number(rawProductId) : undefined;

  const { currentOrganization } = useOrganization();
  const { addItemToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariationIds, setSelectedVariationIds] = useState<number[]>([]);
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId, currentOrganization?.id],
    queryFn: async () => {
      if (!productId || !currentOrganization?.id) return null;

      let query = supabase
        .from('wc_products')
        .select('*')
        .eq('id', productId);

      query = query.or(`organization_id.is.null,organization_id.eq.${currentOrganization.id}`);

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Erro ao buscar produto:", error);
        throw new Error(error.message);
      }

      return data as any;
    },
    enabled: !!productId && !!currentOrganization?.id,
    staleTime: 60000,
  });

  const { data: variations, isLoading: isVariationsLoading, isError: isVariationsError } = useQuery({
    queryKey: ['product-variations', productId, currentOrganization?.id],
    queryFn: async () => {
      if (!productId || !currentOrganization?.id) return [];

      let query = supabase
        .from('wc_product_variations')
        .select('*')
        .eq('parent_id', productId);

      query = query.or(`organization_id.is.null,organization_id.eq.${currentOrganization.id}`);

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar variações:", error);
        throw new Error(error.message);
      }

      return data as any[];
    },
    enabled: !!productId && !!currentOrganization?.id,
    staleTime: 60000,
  });

  const displayVariations = React.useMemo(() => {
    if (!variations) return [];
    return variations;
  }, [variations]);

  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produto",
        description: "Verifique sua conexão com a internet.",
      });
      navigate('/stock');
    }
    if (isVariationsError) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar variações",
        description: "Verifique sua conexão com a internet.",
      });
      navigate('/stock');
    }
  }, [isError, isVariationsError, navigate, toast]);

  // NOVO: experiência amigável quando não há productId na URL
  if (!productId) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-2">PDV</h1>
        <p className="text-muted-foreground mb-4">
          Para usar o PDV, selecione um produto na página de Estoque.
        </p>
        <Button onClick={() => navigate('/stock')}>Ir para Estoque</Button>
      </div>
    );
  }

  if (isLoading || isVariationsLoading) {
    return <div>Carregando...</div>;
  }

  if (!product) {
    return <div>Produto não encontrado.</div>;
  }

  const handleAddToCart = () => {
    if (product.type === 'variable' && selectedVariationIds.length === 0) {
      setIsVariationModalOpen(true);
      return;
    }

    if (product.type === 'variable') {
      // Se for um produto variável, adicione cada variação selecionada individualmente
      selectedVariationIds.forEach(variationId => {
        const variation = variations?.find(v => v.id === variationId);
        if (variation) {
          const attrValues = Array.isArray(variation?.attributes)
            ? variation.attributes
                .map((a: any) => (a?.value ?? a?.option))
                .filter((v: any) => v !== undefined && v !== null && String(v).trim() !== '')
            : [];
          const variationTitle =
            attrValues.length > 0
              ? attrValues.join(' - ')
              : (variation as any)?.name ? String((variation as any).name) : `Variação #${variation?.id ?? ''}`;

          const price = Number(variation.price ?? variation.regular_price ?? 0);

          addItemToCart({
            // garantir um ID único por variação
            id: `variation-${variation.id}`,
            name: `${product.name} - ${variationTitle}`,
            price,
            quantity,
            sku: variation?.sku ?? null,
            productId: product.id,
            variationId: variation.id,
          });
        }
      });
      toast({
        title: "Adicionado ao carrinho",
        description: `${product.name} (variações) adicionado com sucesso.`,
      });
    } else {
      // Se for um produto simples, adicione o produto diretamente
      const price = Number(product.price ?? product.regular_price ?? 0);
      addItemToCart({
        id: product.id,
        name: product.name,
        price,
        quantity,
        sku: null,
      });
      toast({
        title: "Adicionado ao carrinho",
        description: `${product.name} adicionado com sucesso.`,
      });
    }
  };

  const handleSelectVariation = (variationId: number) => {
    setSelectedVariationIds(prev => {
      if (prev.includes(variationId)) {
        return prev.filter(id => id !== variationId);
      } else {
        return [...prev, variationId];
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
      {product.images && product.images.length > 0 && (
        <img src={product.images[0].src} alt={product.name} className="w-64 h-64 object-cover mb-4" />
      )}
      <p className="mb-4">{product.description}</p>

      <div className="mb-4">
        <Label htmlFor="quantity">Quantidade:</Label>
        <Input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          className="w-24"
        />
      </div>

      <Button onClick={handleAddToCart} className="px-4 py-2 rounded">
        Adicionar ao Carrinho
      </Button>

      <Dialog open={isVariationModalOpen} onOpenChange={setIsVariationModalOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Selecionar Variações</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Selecione as Variações</DialogTitle>
            <DialogDescription>
              Escolha as variações desejadas para adicionar ao carrinho.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {displayVariations?.map((variation: any) => {
              // Título da variação: juntar os valores dos atributos usando " - "
              const hasAttrs = Array.isArray(variation?.attributes) && variation.attributes.length > 0;
              const attrValues = hasAttrs
                ? variation.attributes
                    .map((a: any) => (a?.value ?? a?.option))
                    .filter((v: any) => v !== undefined && v !== null && String(v).trim() !== '')
                : [];
              const variationTitle =
                attrValues.length > 0
                  ? attrValues.join(' - ')
                  : (variation?.name ? String(variation.name) : `Variação #${variation?.id ?? ''}`);

              const priceValue = variation?.price ?? variation?.regular_price ?? 0;

              const isSelected = selectedVariationIds.includes(variation?.id);
              return (
                <button
                  key={variation?.id}
                  className={`w-full p-3 rounded-md border flex items-center justify-between text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                  onClick={() => handleSelectVariation(variation?.id)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{variationTitle}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      SKU: {variation?.sku ? String(variation.sku) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <div className="font-semibold">
                      {formatCurrency(priceValue)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Estoque: {variation?.stock_quantity ?? 0}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <Button onClick={() => setIsVariationModalOpen(false)}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
