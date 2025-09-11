-- Create label print history table if not exists
CREATE TABLE IF NOT EXISTS label_print_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    label_type TEXT NOT NULL DEFAULT 'standard',
    format TEXT NOT NULL DEFAULT 'A4',
    printed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user configurations table if not exists
CREATE TABLE IF NOT EXISTS user_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    config_type TEXT NOT NULL,
    config_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, config_type)
);

-- Create default label template if none exists
INSERT INTO pdf_templates (name, type, format, html_template, css_styles, printer_type, paper_size, orientation, margins, is_active, is_default)
SELECT 
    'Template Padrão de Etiquetas',
    'etiqueta',
    'A4',
    '<div class="label">
        <div class="product-name">{{name}}</div>
        <div class="product-sku">SKU: {{sku}}</div>
        <div class="product-price">R$ {{price}}</div>
        {{#if barcode}}<div class="barcode">{{barcode}}</div>{{/if}}
        {{#if qr_code}}<div class="qr-code">{{qr_code}}</div>{{/if}}
    </div>',
    '.label {
        width: 100%;
        height: 100%;
        padding: 8px;
        font-family: Arial, sans-serif;
        border: 1px solid #ddd;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .product-name {
        font-size: 12px;
        font-weight: bold;
        line-height: 1.2;
        margin-bottom: 4px;
    }
    .product-sku {
        font-size: 10px;
        color: #666;
        margin-bottom: 4px;
    }
    .product-price {
        font-size: 14px;
        font-weight: bold;
        color: #000;
        margin-bottom: 4px;
    }
    .barcode, .qr-code {
        font-size: 8px;
        text-align: center;
        margin-top: auto;
    }',
    'pdf',
    'A4',
    'portrait',
    '{"top": 10, "right": 10, "bottom": 10, "left": 10}',
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM pdf_templates 
    WHERE type = 'etiqueta' AND is_active = true
);

-- Create another simple template for variety
INSERT INTO pdf_templates (name, type, format, html_template, css_styles, printer_type, paper_size, orientation, margins, is_active, is_default)
SELECT 
    'Template Simples',
    'etiqueta',
    'A4',
    '<div class="simple-label">
        <h3>{{name}}</h3>
        <p>{{sku}}</p>
        <div class="price">{{price}}</div>
    </div>',
    '.simple-label {
        border: 1px solid #000;
        padding: 10px;
        text-align: center;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .simple-label h3 {
        margin: 0 0 8px 0;
        font-size: 14px;
    }
    .simple-label p {
        margin: 0 0 8px 0;
        font-size: 10px;
        color: #666;
    }
    .price {
        font-size: 16px;
        font-weight: bold;
    }',
    'pdf',
    'A4',
    'portrait',
    '{"top": 10, "right": 10, "bottom": 10, "left": 10}',
    true,
    false
WHERE NOT EXISTS (
    SELECT 1 FROM pdf_templates 
    WHERE name = 'Template Simples' AND type = 'etiqueta'
);

-- Enable RLS on new tables
ALTER TABLE label_print_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their organization label history" ON label_print_history
    FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Users can manage their own configurations" ON user_configurations
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_label_print_history_org_date ON label_print_history(organization_id, printed_at DESC);
CREATE INDEX IF NOT EXISTS idx_label_print_history_product ON label_print_history(product_id, printed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_configurations_user_type ON user_configurations(user_id, config_type);