-- Adicionar campos para informações do pedido na tabela maletas
ALTER TABLE public.maletas 
ADD COLUMN order_number integer NULL,
ADD COLUMN order_url text NULL;