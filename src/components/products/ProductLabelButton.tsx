
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProductLabelButtonProps {
  product: {
    id: number;
    name: string;
    sku: string;
    price: string;
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const ProductLabelButton: React.FC<ProductLabelButtonProps> = ({ 
  product, 
  variant = 'outline',
  size = 'sm'
}) => {
  const navigate = useNavigate();

  const handleGenerateLabel = () => {
    // Navegar para a página de etiquetas com o produto pré-selecionado
    navigate('/labels', { 
      state: { 
        selectedProduct: product,
        autoSelect: true 
      }
    });
    
    toast.success(`Produto ${product.name} selecionado para gerar etiqueta`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGenerateLabel}
      className="flex items-center gap-1"
    >
      <Printer className="h-3 w-3" />
      Etiqueta
    </Button>
  );
};
