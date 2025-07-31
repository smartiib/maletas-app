export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      commission_tiers: {
        Row: {
          bonus: number | null
          created_at: string
          id: string
          is_active: boolean | null
          label: string
          max_amount: number | null
          min_amount: number
          percentage: number
        }
        Insert: {
          bonus?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          label: string
          max_amount?: number | null
          min_amount: number
          percentage: number
        }
        Update: {
          bonus?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          label?: string
          max_amount?: number | null
          min_amount?: number
          percentage?: number
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          sent_at: string
          status: string
          subject: string
          to_email: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          sent_at?: string
          status?: string
          subject: string
          to_email: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          sent_at?: string
          status?: string
          subject?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string
          id: string
          notes: string | null
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      maleta_items: {
        Row: {
          created_at: string
          id: string
          maleta_id: string
          name: string
          price: number
          product_id: number
          quantity: number
          sku: string
          status: string
          updated_at: string
          variation_attributes: Json | null
          variation_id: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          maleta_id: string
          name: string
          price: number
          product_id: number
          quantity: number
          sku: string
          status?: string
          updated_at?: string
          variation_attributes?: Json | null
          variation_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          maleta_id?: string
          name?: string
          price?: number
          product_id?: number
          quantity?: number
          sku?: string
          status?: string
          updated_at?: string
          variation_attributes?: Json | null
          variation_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maleta_items_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas"
            referencedColumns: ["id"]
          },
        ]
      }
      maleta_returns: {
        Row: {
          commission_amount: number | null
          created_at: string
          delay_days: number | null
          final_amount: number | null
          id: string
          items_returned: Json
          items_sold: Json
          maleta_id: string
          notes: string | null
          penalty_amount: number | null
          return_date: string
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string
          delay_days?: number | null
          final_amount?: number | null
          id?: string
          items_returned?: Json
          items_sold?: Json
          maleta_id: string
          notes?: string | null
          penalty_amount?: number | null
          return_date?: string
        }
        Update: {
          commission_amount?: number | null
          created_at?: string
          delay_days?: number | null
          final_amount?: number | null
          id?: string
          items_returned?: Json
          items_sold?: Json
          maleta_id?: string
          notes?: string | null
          penalty_amount?: number | null
          return_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "maleta_returns_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas"
            referencedColumns: ["id"]
          },
        ]
      }
      maletas: {
        Row: {
          commission_settings: Json | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          departure_date: string
          extended_date: string | null
          id: string
          notes: string | null
          number: string
          order_number: number | null
          order_url: string | null
          representative_id: string
          return_date: string
          status: string
          total_value: number | null
          updated_at: string
        }
        Insert: {
          commission_settings?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          departure_date?: string
          extended_date?: string | null
          id?: string
          notes?: string | null
          number: string
          order_number?: number | null
          order_url?: string | null
          representative_id: string
          return_date: string
          status?: string
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          commission_settings?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          departure_date?: string
          extended_date?: string | null
          id?: string
          notes?: string | null
          number?: string
          order_number?: number | null
          order_url?: string | null
          representative_id?: string
          return_date?: string
          status?: string
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maletas_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_limits: {
        Row: {
          current_products: number
          current_stores: number
          current_users: number
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          current_products?: number
          current_stores?: number
          current_users?: number
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          current_products?: number
          current_stores?: number
          current_users?: number
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_limits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          asaas_customer_id: string | null
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          asaas_customer_id?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          asaas_customer_id?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_installments: {
        Row: {
          amount: number
          created_at: string
          discount: number | null
          due_date: string
          id: string
          installment_number: number
          late_fee: number | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_plan_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          discount?: number | null
          due_date: string
          id?: string
          installment_number: number
          late_fee?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_plan_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          discount?: number | null
          due_date?: string
          id?: string
          installment_number?: number
          late_fee?: number | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_plan_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          installments_count: number
          interest_rate: number | null
          notes: string | null
          order_id: number
          order_number: string | null
          payment_type: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          installments_count: number
          interest_rate?: number | null
          notes?: string | null
          order_id: number
          order_number?: string | null
          payment_type: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          installments_count?: number
          interest_rate?: number | null
          notes?: string | null
          order_id?: number
          order_number?: string | null
          payment_type?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          asaas_payment_id: string
          created_at: string
          id: string
          payment_date: string | null
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          asaas_payment_id: string
          created_at?: string
          id?: string
          payment_date?: string | null
          status: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          asaas_payment_id?: string
          created_at?: string
          id?: string
          payment_date?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_templates: {
        Row: {
          created_at: string
          css_styles: string | null
          format: string
          html_template: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          settings: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          css_styles?: string | null
          format: string
          html_template: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          settings?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          css_styles?: string | null
          format?: string
          html_template?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          settings?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_suppliers: {
        Row: {
          cost_price: number | null
          created_at: string
          id: string
          is_primary: boolean | null
          lead_time_days: number | null
          minimum_order_quantity: number | null
          product_id: number
          supplier_id: string
          supplier_sku: string | null
          updated_at: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          lead_time_days?: number | null
          minimum_order_quantity?: number | null
          product_id: number
          supplier_id: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          lead_time_days?: number | null
          minimum_order_quantity?: number | null
          product_id?: number
          supplier_id?: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      representatives: {
        Row: {
          commission_settings: Json | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          referrer_id: string | null
          total_sales: number | null
          updated_at: string
        }
        Insert: {
          commission_settings?: Json | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          referrer_id?: string | null
          total_sales?: number | null
          updated_at?: string
        }
        Update: {
          commission_settings?: Json | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          referrer_id?: string | null
          total_sales?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "representatives_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_history: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          new_stock: number
          previous_stock: number
          product_id: number
          quantity_change: number
          reason: string | null
          source: string
          type: string
          user_id: string | null
          user_name: string | null
          variation_id: number | null
          wc_order_id: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          new_stock: number
          previous_stock: number
          product_id: number
          quantity_change: number
          reason?: string | null
          source?: string
          type: string
          user_id?: string | null
          user_name?: string | null
          variation_id?: number | null
          wc_order_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          new_stock?: number
          previous_stock?: number
          product_id?: number
          quantity_change?: number
          reason?: string | null
          source?: string
          type?: string
          user_id?: string | null
          user_name?: string | null
          variation_id?: number | null
          wc_order_id?: number | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          max_products: number
          max_stores: number
          max_users: number
          name: string
          price_monthly: number
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          max_products?: number
          max_stores?: number
          max_users?: number
          name: string
          price_monthly?: number
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          max_products?: number
          max_stores?: number
          max_users?: number
          name?: string
          price_monthly?: number
          type?: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          asaas_subscription_id: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          organization_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          asaas_subscription_id?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          asaas_subscription_id?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      sync_config: {
        Row: {
          auto_sync_enabled: boolean | null
          config_data: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          next_sync_at: string | null
          sync_interval: string | null
          sync_on_startup: boolean | null
          sync_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          config_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          sync_interval?: string | null
          sync_on_startup?: boolean | null
          sync_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_sync_enabled?: boolean | null
          config_data?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          sync_interval?: string | null
          sync_on_startup?: boolean | null
          sync_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          duration_ms: number | null
          error_details: string | null
          id: string
          items_failed: number | null
          items_processed: number | null
          message: string
          operation: string
          status: string
          sync_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_details?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          message: string
          operation: string
          status?: string
          sync_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_details?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          message?: string
          operation?: string
          status?: string
          sync_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_configurations: {
        Row: {
          config_data: Json
          config_type: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          config_data?: Json
          config_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          config_data?: Json
          config_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wc_product_categories: {
        Row: {
          count: number | null
          created_at: string | null
          description: string | null
          display: string | null
          id: number
          image: Json | null
          menu_order: number | null
          name: string
          parent: number | null
          slug: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          description?: string | null
          display?: string | null
          id: number
          image?: Json | null
          menu_order?: number | null
          name: string
          parent?: number | null
          slug?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          count?: number | null
          created_at?: string | null
          description?: string | null
          display?: string | null
          id?: number
          image?: Json | null
          menu_order?: number | null
          name?: string
          parent?: number | null
          slug?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wc_product_variations: {
        Row: {
          attributes: Json | null
          backordered: boolean | null
          backorders: string | null
          backorders_allowed: boolean | null
          created_at: string | null
          date_created: string | null
          date_modified: string | null
          date_on_sale_from: string | null
          date_on_sale_to: string | null
          description: string | null
          dimensions: Json | null
          download_expiry: number | null
          download_limit: number | null
          downloadable: boolean | null
          downloads: Json | null
          id: number
          image: Json | null
          low_stock_amount: number | null
          manage_stock: boolean | null
          menu_order: number | null
          meta_data: Json | null
          on_sale: boolean | null
          parent_id: number
          permalink: string | null
          price: number | null
          purchasable: boolean | null
          regular_price: number | null
          sale_price: number | null
          shipping_class: string | null
          shipping_class_id: number | null
          sku: string | null
          status: string | null
          stock_quantity: number | null
          stock_status: string | null
          synced_at: string | null
          tax_class: string | null
          tax_status: string | null
          updated_at: string | null
          virtual: boolean | null
          weight: string | null
        }
        Insert: {
          attributes?: Json | null
          backordered?: boolean | null
          backorders?: string | null
          backorders_allowed?: boolean | null
          created_at?: string | null
          date_created?: string | null
          date_modified?: string | null
          date_on_sale_from?: string | null
          date_on_sale_to?: string | null
          description?: string | null
          dimensions?: Json | null
          download_expiry?: number | null
          download_limit?: number | null
          downloadable?: boolean | null
          downloads?: Json | null
          id: number
          image?: Json | null
          low_stock_amount?: number | null
          manage_stock?: boolean | null
          menu_order?: number | null
          meta_data?: Json | null
          on_sale?: boolean | null
          parent_id: number
          permalink?: string | null
          price?: number | null
          purchasable?: boolean | null
          regular_price?: number | null
          sale_price?: number | null
          shipping_class?: string | null
          shipping_class_id?: number | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          stock_status?: string | null
          synced_at?: string | null
          tax_class?: string | null
          tax_status?: string | null
          updated_at?: string | null
          virtual?: boolean | null
          weight?: string | null
        }
        Update: {
          attributes?: Json | null
          backordered?: boolean | null
          backorders?: string | null
          backorders_allowed?: boolean | null
          created_at?: string | null
          date_created?: string | null
          date_modified?: string | null
          date_on_sale_from?: string | null
          date_on_sale_to?: string | null
          description?: string | null
          dimensions?: Json | null
          download_expiry?: number | null
          download_limit?: number | null
          downloadable?: boolean | null
          downloads?: Json | null
          id?: number
          image?: Json | null
          low_stock_amount?: number | null
          manage_stock?: boolean | null
          menu_order?: number | null
          meta_data?: Json | null
          on_sale?: boolean | null
          parent_id?: number
          permalink?: string | null
          price?: number | null
          purchasable?: boolean | null
          regular_price?: number | null
          sale_price?: number | null
          shipping_class?: string | null
          shipping_class_id?: number | null
          sku?: string | null
          status?: string | null
          stock_quantity?: number | null
          stock_status?: string | null
          synced_at?: string | null
          tax_class?: string | null
          tax_status?: string | null
          updated_at?: string | null
          virtual?: boolean | null
          weight?: string | null
        }
        Relationships: []
      }
      wc_products: {
        Row: {
          attributes: Json | null
          average_rating: string | null
          backordered: boolean | null
          backorders: string | null
          backorders_allowed: boolean | null
          button_text: string | null
          catalog_visibility: string | null
          categories: Json | null
          created_at: string | null
          cross_sell_ids: Json | null
          date_created: string | null
          date_modified: string | null
          date_on_sale_from: string | null
          date_on_sale_to: string | null
          default_attributes: Json | null
          description: string | null
          dimensions: Json | null
          download_expiry: number | null
          download_limit: number | null
          downloadable: boolean | null
          downloads: Json | null
          external_url: string | null
          featured: boolean | null
          global_unique_id: string | null
          grouped_products: Json | null
          has_options: boolean | null
          id: number
          images: Json | null
          low_stock_amount: number | null
          manage_stock: boolean | null
          menu_order: number | null
          meta_data: Json | null
          name: string
          on_sale: boolean | null
          parent_id: number | null
          permalink: string | null
          post_password: string | null
          price: number | null
          price_html: string | null
          purchasable: boolean | null
          purchase_note: string | null
          rating_count: number | null
          regular_price: number | null
          related_ids: Json | null
          reviews_allowed: boolean | null
          sale_price: number | null
          shipping_class: string | null
          shipping_class_id: number | null
          shipping_required: boolean | null
          shipping_taxable: boolean | null
          short_description: string | null
          sku: string | null
          slug: string | null
          sold_individually: boolean | null
          status: string | null
          stock_quantity: number | null
          stock_status: string | null
          synced_at: string | null
          tags: Json | null
          tax_class: string | null
          tax_status: string | null
          total_sales: number | null
          type: string | null
          updated_at: string | null
          upsell_ids: Json | null
          variations: Json | null
          virtual: boolean | null
          weight: string | null
        }
        Insert: {
          attributes?: Json | null
          average_rating?: string | null
          backordered?: boolean | null
          backorders?: string | null
          backorders_allowed?: boolean | null
          button_text?: string | null
          catalog_visibility?: string | null
          categories?: Json | null
          created_at?: string | null
          cross_sell_ids?: Json | null
          date_created?: string | null
          date_modified?: string | null
          date_on_sale_from?: string | null
          date_on_sale_to?: string | null
          default_attributes?: Json | null
          description?: string | null
          dimensions?: Json | null
          download_expiry?: number | null
          download_limit?: number | null
          downloadable?: boolean | null
          downloads?: Json | null
          external_url?: string | null
          featured?: boolean | null
          global_unique_id?: string | null
          grouped_products?: Json | null
          has_options?: boolean | null
          id: number
          images?: Json | null
          low_stock_amount?: number | null
          manage_stock?: boolean | null
          menu_order?: number | null
          meta_data?: Json | null
          name: string
          on_sale?: boolean | null
          parent_id?: number | null
          permalink?: string | null
          post_password?: string | null
          price?: number | null
          price_html?: string | null
          purchasable?: boolean | null
          purchase_note?: string | null
          rating_count?: number | null
          regular_price?: number | null
          related_ids?: Json | null
          reviews_allowed?: boolean | null
          sale_price?: number | null
          shipping_class?: string | null
          shipping_class_id?: number | null
          shipping_required?: boolean | null
          shipping_taxable?: boolean | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          sold_individually?: boolean | null
          status?: string | null
          stock_quantity?: number | null
          stock_status?: string | null
          synced_at?: string | null
          tags?: Json | null
          tax_class?: string | null
          tax_status?: string | null
          total_sales?: number | null
          type?: string | null
          updated_at?: string | null
          upsell_ids?: Json | null
          variations?: Json | null
          virtual?: boolean | null
          weight?: string | null
        }
        Update: {
          attributes?: Json | null
          average_rating?: string | null
          backordered?: boolean | null
          backorders?: string | null
          backorders_allowed?: boolean | null
          button_text?: string | null
          catalog_visibility?: string | null
          categories?: Json | null
          created_at?: string | null
          cross_sell_ids?: Json | null
          date_created?: string | null
          date_modified?: string | null
          date_on_sale_from?: string | null
          date_on_sale_to?: string | null
          default_attributes?: Json | null
          description?: string | null
          dimensions?: Json | null
          download_expiry?: number | null
          download_limit?: number | null
          downloadable?: boolean | null
          downloads?: Json | null
          external_url?: string | null
          featured?: boolean | null
          global_unique_id?: string | null
          grouped_products?: Json | null
          has_options?: boolean | null
          id?: number
          images?: Json | null
          low_stock_amount?: number | null
          manage_stock?: boolean | null
          menu_order?: number | null
          meta_data?: Json | null
          name?: string
          on_sale?: boolean | null
          parent_id?: number | null
          permalink?: string | null
          post_password?: string | null
          price?: number | null
          price_html?: string | null
          purchasable?: boolean | null
          purchase_note?: string | null
          rating_count?: number | null
          regular_price?: number | null
          related_ids?: Json | null
          reviews_allowed?: boolean | null
          sale_price?: number | null
          shipping_class?: string | null
          shipping_class_id?: number | null
          shipping_required?: boolean | null
          shipping_taxable?: boolean | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          sold_individually?: boolean | null
          status?: string | null
          stock_quantity?: number | null
          stock_status?: string | null
          synced_at?: string | null
          tags?: Json | null
          tax_class?: string | null
          tax_status?: string | null
          total_sales?: number | null
          type?: string | null
          updated_at?: string | null
          upsell_ids?: Json | null
          variations?: Json | null
          virtual?: boolean | null
          weight?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          processing_time_ms: number | null
          response_data: Json | null
          source_ip: string | null
          status: string
          updated_at: string
          user_agent: string | null
          webhook_id: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type: string
          id?: string
          processing_time_ms?: number | null
          response_data?: Json | null
          source_ip?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          webhook_id?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processing_time_ms?: number | null
          response_data?: Json | null
          source_ip?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          webhook_id?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_stock_history_entry: {
        Args: {
          p_product_id: number
          p_variation_id?: number
          p_type?: string
          p_quantity_change?: number
          p_previous_stock?: number
          p_new_stock?: number
          p_reason?: string
          p_source?: string
          p_user_id?: string
          p_user_name?: string
          p_wc_order_id?: number
          p_metadata?: Json
        }
        Returns: string
      }
      generate_maleta_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organizations: {
        Args: { user_uuid?: string }
        Returns: string[]
      }
      user_belongs_to_organization: {
        Args: { org_id: string; user_uuid?: string }
        Returns: boolean
      }
    }
    Enums: {
      subscription_plan_type: "trial" | "basic" | "professional" | "enterprise"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
      user_role: "owner" | "admin" | "manager" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_plan_type: ["trial", "basic", "professional", "enterprise"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
      user_role: ["owner", "admin", "manager", "user"],
    },
  },
} as const
