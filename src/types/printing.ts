
export interface PrintTemplate {
  id: string;
  name: string;
  type: TemplateType;
  format: TemplateFormat;
  html_template: string;
  css_styles?: string;
  printer_type: PrinterType;
  paper_size: PaperSize;
  orientation: Orientation;
  margins: Margins;
  settings?: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PrintJob {
  id: string;
  organization_id?: string;
  user_id?: string;
  template_id?: string;
  template_type: TemplateType;
  template_data: Record<string, any>;
  printer_config: PrinterConfig;
  quantity: number;
  status: PrintJobStatus;
  priority: number;
  error_message?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PrinterConfiguration {
  id: string;
  organization_id?: string;
  name: string;
  printer_type: PrinterType;
  connection_type: ConnectionType;
  connection_config: ConnectionConfig;
  default_settings: PrinterSettings;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type TemplateType = 
  | 'product_label' 
  | 'promo_label' 
  | 'maleta_label' 
  | 'romaneio' 
  | 'etiqueta' 
  | 'relatorio' 
  | 'invoice' 
  | 'receipt';

export type TemplateFormat = 
  | 'A4' 
  | 'thermal_80mm' 
  | 'thermal_58mm' 
  | 'label_50x30' 
  | 'label_40x20' 
  | 'custom';

export type PrinterType = 
  | 'pdf' 
  | 'thermal' 
  | 'zebra' 
  | 'laser' 
  | 'inkjet' 
  | 'label_printer';

export type PaperSize = 
  | 'A4' 
  | 'A5' 
  | 'Letter' 
  | '80mm' 
  | '58mm' 
  | '50x30mm' 
  | '40x20mm' 
  | 'custom';

export type Orientation = 'portrait' | 'landscape';

export type PrintJobStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type ConnectionType = 
  | 'network' 
  | 'usb' 
  | 'bluetooth' 
  | 'serial' 
  | 'cloud';

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PrinterConfig {
  printer_id?: string;
  printer_type: PrinterType;
  paper_size: PaperSize;
  orientation: Orientation;
  margins: Margins;
  quality?: 'draft' | 'normal' | 'high';
  copies?: number;
}

export interface ConnectionConfig {
  ip_address?: string;
  port?: number;
  protocol?: string;
  device_path?: string;
  bluetooth_id?: string;
  api_endpoint?: string;
  credentials?: Record<string, string>;
}

export interface PrinterSettings {
  default_paper_size: PaperSize;
  default_orientation: Orientation;
  default_margins: Margins;
  print_speed?: number;
  darkness?: number;
  heat_setting?: number;
}

export interface LabelData {
  product_id?: number;
  name: string;
  sku: string;
  price: number;
  original_price?: number;
  barcode?: string;
  qr_code?: string;
  category?: string;
  brand?: string;
  size?: string;
  color?: string;
  promotion?: boolean;
  discount_percentage?: number;
  expiry_date?: string;
  batch_number?: string;
}

export interface RomaneioData {
  maleta_number: string;
  representative_name: string;
  representative_email: string;
  representative_phone: string;
  departure_date: string;
  return_date: string;
  items: Array<{
    id: number;
    name: string;
    sku: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  total_value: string;
  total_items: number;
  current_date: string;
  company_info?: CompanyInfo;
}

export interface CompanyInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  cnpj: string;
  instagram?: string;
  logo_url?: string;
}

export interface PrintServiceOptions {
  template?: PrintTemplate;
  data: Record<string, any>;
  printer_config?: PrinterConfig;
  quantity?: number;
  priority?: number;
}
