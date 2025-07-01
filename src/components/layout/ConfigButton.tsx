
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';

const ConfigButton = () => {
  const navigate = useNavigate();
  
  // Mostrar botão apenas se WordPress não estiver configurado
  const wpUrl = localStorage.getItem('wp_base_url');
  const hasWpConfig = wpUrl && authService.isAuthenticated();
  
  if (hasWpConfig) return null;

  return (
    <Button
      onClick={() => navigate('/configuracoes')}
      variant="outline"
      size="sm"
      className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-none hover:opacity-90"
    >
      <Settings className="w-4 h-4 mr-2" />
      Configurar Sistema
    </Button>
  );
};

export default ConfigButton;
