-- Create sync queue table for controlling synchronization
CREATE TABLE public.sync_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('customer', 'product', 'order', 'category')),
  entity_id integer NOT NULL,
  operation text NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'syncing', 'completed', 'failed', 'retrying')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  scheduled_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  priority integer DEFAULT 0
);

-- Enable RLS on sync_queue
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sync_queue
CREATE POLICY "Users can manage sync queue for their organization"
ON public.sync_queue
FOR ALL
USING (organization_id IN (SELECT get_user_organizations()));

-- Create indexes for performance
CREATE INDEX idx_sync_queue_organization_status ON public.sync_queue(organization_id, status);
CREATE INDEX idx_sync_queue_entity ON public.sync_queue(entity_type, entity_id);
CREATE INDEX idx_sync_queue_scheduled ON public.sync_queue(scheduled_at) WHERE status = 'pending';

-- Create trigger for updated_at
CREATE TRIGGER update_sync_queue_updated_at
  BEFORE UPDATE ON public.sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();