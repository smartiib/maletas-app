// Billing page disabled for non-SaaS mode
// This file contains the original billing logic for future reactivation

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
// import { useSubscription } from '@/hooks/useSubscription';
// import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Clock, CreditCard, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const BillingDisabled = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Funcionalidade Desabilitada</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recursos SaaS Temporariamente Desabilitados</CardTitle>
          <CardDescription>
            As funcionalidades de assinatura e billing estão pausadas para desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade será reativada quando o desenvolvimento SaaS for retomado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDisabled;