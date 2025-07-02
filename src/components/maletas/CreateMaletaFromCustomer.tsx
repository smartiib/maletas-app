import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MaletaDialog from './MaletaDialog';

interface CreateMaletaFromCustomerProps {
  representativeId: number;
  representativeName: string;
}

const CreateMaletaFromCustomer: React.FC<CreateMaletaFromCustomerProps> = ({
  representativeId,
  representativeName
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleCreateMaleta = () => {
    // Se não há produtos no carrinho, redirecionar para POS
    if (cartItems.length === 0) {
      navigate('/pos', { 
        state: { 
          preSelectedRepresentative: { 
            id: representativeId, 
            name: representativeName 
          } 
        } 
      });
      return;
    }
    
    // Se há produtos, abrir dialog
    setDialogOpen(true);
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCreateMaleta}
        className="w-full"
      >
        <Package className="w-4 h-4 mr-2" />
        Criar Maleta
      </Button>

      <MaletaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cartItems={cartItems}
        onClearCart={handleClearCart}
      />
    </>
  );
};

export default CreateMaletaFromCustomer;