-- Create storage buckets for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Create policies for product images bucket
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Users can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Create a table for custom categories (in addition to WooCommerce categories)
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.product_categories(id),
  image_url TEXT,
  wc_category_id INTEGER,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for product_categories
CREATE POLICY "Users can view organization categories" 
ON public.product_categories 
FOR SELECT 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create organization categories" 
ON public.product_categories 
FOR INSERT 
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update organization categories" 
ON public.product_categories 
FOR UPDATE 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can delete organization categories" 
ON public.product_categories 
FOR DELETE 
USING (organization_id IN (SELECT get_user_organizations()));

-- Create a table for custom tags
CREATE TABLE public.product_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  wc_tag_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for product_tags
CREATE POLICY "Users can view organization tags" 
ON public.product_tags 
FOR SELECT 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create organization tags" 
ON public.product_tags 
FOR INSERT 
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update organization tags" 
ON public.product_tags 
FOR UPDATE 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can delete organization tags" 
ON public.product_tags 
FOR DELETE 
USING (organization_id IN (SELECT get_user_organizations()));

-- Create a table for product images
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  alt_text TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  wc_image_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Create policies for product_images
CREATE POLICY "Users can view organization product images" 
ON public.product_images 
FOR SELECT 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can create organization product images" 
ON public.product_images 
FOR INSERT 
WITH CHECK (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can update organization product images" 
ON public.product_images 
FOR UPDATE 
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can delete organization product images" 
ON public.product_images 
FOR DELETE 
USING (organization_id IN (SELECT get_user_organizations()));

-- Create a junction table for product-tag relationships
CREATE TABLE public.product_tag_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id INTEGER NOT NULL,
  tag_id UUID REFERENCES public.product_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_tag_relations ENABLE ROW LEVEL SECURITY;

-- Create policies for product_tag_relations
CREATE POLICY "Users can view product tag relations" 
ON public.product_tag_relations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create product tag relations" 
ON public.product_tag_relations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can delete product tag relations" 
ON public.product_tag_relations 
FOR DELETE 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_product_categories_org ON public.product_categories(organization_id);
CREATE INDEX idx_product_categories_parent ON public.product_categories(parent_id);
CREATE INDEX idx_product_tags_org ON public.product_tags(organization_id);
CREATE INDEX idx_product_images_org ON public.product_images(organization_id);
CREATE INDEX idx_product_images_product ON public.product_images(product_id);
CREATE INDEX idx_product_tag_relations_product ON public.product_tag_relations(product_id);
CREATE INDEX idx_product_tag_relations_tag ON public.product_tag_relations(tag_id);

-- Create triggers for updated_at
CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_tags_updated_at
BEFORE UPDATE ON public.product_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();